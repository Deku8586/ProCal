import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { User } from 'lucide-react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { supabase } from '../services/supabase';

// Memoized calendar theme — stable object so Calendar never re-renders just for theme
const CALENDAR_THEME = {
    backgroundColor: COLORS.cardDark,
    calendarBackground: COLORS.cardDark,
    textSectionTitleColor: COLORS.textSecondary,
    dayTextColor: COLORS.textPrimary,
    todayTextColor: COLORS.primary,
    selectedDayTextColor: COLORS.background,
    monthTextColor: COLORS.textPrimary,
    arrowColor: COLORS.primary,
    dotColor: COLORS.primary,
    textDisabledColor: '#444',
};

export function ProgressScreen() {
    const isFocused = useIsFocused();
    const navigation = useNavigation<any>();
    const [markedDates, setMarkedDates] = useState<any>({});
    const [streak, setStreak] = useState(0);
    const [proteinGoal, setProteinGoal] = useState(150);
    // Store all logs locally to avoid re-fetching on day tap
    const [allLogs, setAllLogs] = useState<any[]>([]);

    const getTodayString = () => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    };

    const [selectedDate, setSelectedDate] = useState(getTodayString());
    const [selectedStats, setSelectedStats] = useState({ protein: 0, calories: 0 });

    useEffect(() => {
        if (isFocused) {
            loadAllLogs();
        }
    }, [isFocused]);

    const loadAllLogs = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Parallel fetch: profile goals + all logs
            const [profileRes, logsRes] = await Promise.all([
                supabase.from('profiles').select('daily_protein_goal').eq('id', user.id).single(),
                supabase.from('daily_logs').select('*').eq('user_id', user.id).order('date', { ascending: false }),
            ]);

            const goal = profileRes.data?.daily_protein_goal ?? 150;
            setProteinGoal(goal);

            const logs = logsRes.data ?? [];
            setAllLogs(logs);
            buildMarkedDates(logs, selectedDate, goal);
            updateSelectedStats(logs, selectedDate);
            calculateStreak(logs);
        } catch (e) {
            console.error('Failed to load logs for calendar', e);
        }
    };

    const buildMarkedDates = (logs: any[], currentSelected: string, goal: number) => {
        const newMarkedDates: any = {};
        logs.forEach(log => {
            newMarkedDates[log.date] = {
                marked: true,
                dotColor: log.goal_met ? COLORS.success : COLORS.error,
                selected: log.date === currentSelected,
                selectedColor: log.date === currentSelected ? COLORS.primary : undefined,
            };
        });
        if (!newMarkedDates[currentSelected]) {
            newMarkedDates[currentSelected] = { selected: true, selectedColor: COLORS.primary };
        }
        setMarkedDates(newMarkedDates);
    };

    const updateSelectedStats = (logs: any[], date: string) => {
        const entry = logs.find(l => l.date === date);
        if (entry) {
            setSelectedStats({ protein: entry.total_protein, calories: entry.total_calories });
        } else {
            setSelectedStats({ protein: 0, calories: 0 });
        }
    };

    const calculateStreak = (logs: any[]) => {
        let currentStreak = 0;
        const todayObj = new Date();
        for (let i = 0; i < 365; i++) {
            const d = new Date(todayObj);
            d.setDate(todayObj.getDate() - i);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const entry = logs.find(l => l.date === dateStr);
            if (entry?.goal_met) { currentStreak++; } else { break; }
        }
        setStreak(currentStreak);
    };

    // Day press — NO network call, just update local state from cached logs
    const handleDayPress = useCallback((day: any) => {
        const newDate = day.dateString;
        setSelectedDate(newDate);
        updateSelectedStats(allLogs, newDate);

        // Update selection highlight without re-fetching
        setMarkedDates((prev: any) => {
            const updated = { ...prev };
            // Clear previous selection
            Object.keys(updated).forEach(k => {
                if (updated[k].selected) {
                    updated[k] = { ...updated[k], selected: false, selectedColor: undefined };
                }
            });
            // Set new selection
            if (updated[newDate]) {
                updated[newDate] = { ...updated[newDate], selected: true, selectedColor: COLORS.primary };
            } else {
                updated[newDate] = { selected: true, selectedColor: COLORS.primary };
            }
            return updated;
        });
    }, [allLogs]);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.header}>PROGRESS</Text>
                        <Text style={styles.subHeaderText}>Your Logs</Text>
                    </View>
                    <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Profile')}>
                        <User color={COLORS.textPrimary} size={28} />
                    </TouchableOpacity>
                </View>

                {/* Streak Banner */}
                <View style={[styles.streakBanner, { borderColor: COLORS.primary }]}>
                    <Text style={styles.streakEmoji}>{streak > 0 ? '🔥' : '💤'}</Text>
                    <View>
                        <Text style={styles.streakCount}>{streak} Day{streak !== 1 ? 's' : ''} Streak</Text>
                        <Text style={styles.streakSub}>
                            {streak > 0
                                ? `You've hit your protein goal ${streak} day${streak !== 1 ? 's' : ''} in a row!`
                                : 'Log a meal today to start your streak.'}
                        </Text>
                    </View>
                </View>

                <View style={styles.calendarWrapper}>
                    <Calendar
                        style={styles.calendar}
                        markedDates={markedDates}
                        onDayPress={handleDayPress}
                        theme={CALENDAR_THEME}
                    />
                </View>

                {/* Selected day stats */}
                <View style={styles.detailsZone}>
                    <Text style={styles.detailsDate}>{selectedDate}</Text>
                    <View style={styles.detailsCard}>
                        <View style={styles.macroRow}>
                            <Text style={styles.macroLabel}>Protein</Text>
                            <Text style={selectedStats.protein >= proteinGoal * 0.8 ? styles.macroValueSuccess : styles.macroValuePending}>
                                {selectedStats.protein}g / {proteinGoal}g
                            </Text>
                        </View>
                        <View style={styles.macroRow}>
                            <Text style={styles.macroLabel}>Calories</Text>
                            <Text style={styles.macroValuePending}>{selectedStats.calories} kcal</Text>
                        </View>
                        <Text style={styles.statusText}>
                            {selectedStats.protein >= proteinGoal * 0.8
                                ? '✅ Goal Met!'
                                : selectedStats.protein === 0
                                    ? 'No data for this day'
                                    : '⚠️ Below protein goal'}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    // ↓ KEY FIX: use contentContainerStyle with padding, NOT style with flex:1 on ScrollView
    content: { padding: SIZES.padding, paddingBottom: 40 },
    header: { fontSize: SIZES.extraLarge, fontWeight: FONTS.bold as any, color: COLORS.textPrimary, marginTop: SIZES.small },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    profileButton: { marginTop: SIZES.small, padding: SIZES.base, backgroundColor: COLORS.cardDark, borderRadius: 20 },
    subHeaderText: { fontSize: SIZES.medium, color: COLORS.textSecondary, marginBottom: SIZES.large },
    streakBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardDark, borderRadius: SIZES.radius, padding: SIZES.padding, marginBottom: SIZES.large, borderWidth: 1.5, gap: SIZES.medium },
    streakEmoji: { fontSize: 36 },
    streakCount: { color: COLORS.textPrimary, fontSize: SIZES.large, fontWeight: FONTS.bold as any },
    streakSub: { color: COLORS.textSecondary, fontSize: SIZES.small, marginTop: 2 },
    calendarWrapper: { borderRadius: SIZES.radius, overflow: 'hidden', marginBottom: SIZES.extraLarge },
    calendar: { borderRadius: SIZES.radius, paddingBottom: 10 },
    detailsZone: { marginBottom: SIZES.large },
    detailsDate: { color: COLORS.textSecondary, fontSize: SIZES.small, fontWeight: FONTS.semiBold as any, textTransform: 'uppercase', marginBottom: SIZES.small, letterSpacing: 1 },
    detailsCard: { backgroundColor: COLORS.cardWhite, borderRadius: SIZES.radius, padding: SIZES.padding },
    macroRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SIZES.small },
    macroLabel: { color: COLORS.textDark, fontSize: SIZES.medium, fontWeight: FONTS.semiBold as any },
    macroValueSuccess: { color: COLORS.success, fontSize: SIZES.medium, fontWeight: FONTS.bold as any },
    macroValuePending: { color: COLORS.textDark, fontSize: SIZES.medium, fontWeight: FONTS.bold as any },
    statusText: { marginTop: SIZES.small, textAlign: 'center', color: COLORS.textDark, fontWeight: FONTS.bold as any, fontSize: SIZES.large },
});
