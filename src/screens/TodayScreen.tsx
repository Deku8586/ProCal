import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, User } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useIsFocused } from '@react-navigation/native';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { MacroRing } from '../components/MacroRing';
import { supabase } from '../services/supabase';

type MealItem = {
    name: string;
    calories: number;
    protein: number;
};

export function TodayScreen() {
    const navigation = useNavigation<any>();
    const isFocused = useIsFocused();

    const [mealInput, setMealInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Goals loaded from Supabase profiles
    const [dailyGoal, setDailyGoal] = useState({ protein: 150, calories: 2500 });
    const [currentTotals, setCurrentTotals] = useState({ protein: 0, calories: 0 });
    const [meals, setMeals] = useState<MealItem[]>([]);
    const [streak, setStreak] = useState(0);

    const getTodayDateStr = () => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    };

    useEffect(() => {
        if (isFocused) {
            loadData();
        }
    }, [isFocused]);

    const loadData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Load user goals
            const { data: profile } = await supabase
                .from('profiles')
                .select('daily_protein_goal, daily_calorie_goal')
                .eq('id', user.id)
                .single();
            if (profile) {
                setDailyGoal({ protein: profile.daily_protein_goal, calories: profile.daily_calorie_goal });
            }

            // 2. Load today's log
            const today = getTodayDateStr();
            const { data: log } = await supabase
                .from('daily_logs')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', today)
                .single();
            if (log) {
                setCurrentTotals({ protein: log.total_protein, calories: log.total_calories });
                setMeals(log.meals_array || []);
            } else {
                setCurrentTotals({ protein: 0, calories: 0 });
                setMeals([]);
            }

            // 3. Calculate streak from daily_logs
            const { data: logs } = await supabase
                .from('daily_logs')
                .select('date, goal_met')
                .eq('user_id', user.id)
                .order('date', { ascending: false });
            if (logs) {
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
            }
        } catch (e) {
            console.error('Failed to load today data', e);
        }
    };

    const handleLogMeal = async () => {
        if (!mealInput.trim()) return;
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase.functions.invoke('analyze-meal', {
                body: { meal_text: mealInput }
            });
            if (error) throw new Error(error.message);

            if (data && data.calories !== undefined) {
                const newMeal: MealItem = { name: mealInput, calories: data.calories, protein: data.protein };
                const updatedMeals = [newMeal, ...meals];
                const updatedTotals = {
                    protein: Math.round((currentTotals.protein + data.protein) * 10) / 10,
                    calories: currentTotals.calories + data.calories,
                };

                setMeals(updatedMeals);
                setCurrentTotals(updatedTotals);
                setMealInput('');

                // Upsert to daily_logs in Supabase
                const today = getTodayDateStr();
                const goalMet = updatedTotals.protein >= dailyGoal.protein * 0.8;
                await supabase.from('daily_logs').upsert({
                    user_id: user.id,
                    date: today,
                    total_protein: updatedTotals.protein,
                    total_calories: updatedTotals.calories,
                    meals_array: updatedMeals,
                    goal_met: goalMet,
                }, { onConflict: 'user_id,date' });
            }
        } catch (err: any) {
            console.error('Error logging meal:', err);
            Alert.alert('Error', 'Could not analyze meal. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>

                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.dateText}>TODAY</Text>
                            <Text style={styles.subHeaderText}>Stay on track</Text>
                        </View>
                        <View style={styles.headerRight}>
                            {streak > 0 && (
                                <View style={styles.streakPill}>
                                    <Text style={styles.streakPillText}>🔥 {streak}</Text>
                                </View>
                            )}
                            <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Profile')}>
                                <User color={COLORS.textPrimary} size={28} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.ringsContainer}>
                        <MacroRing
                            label="Protein"
                            current={currentTotals.protein}
                            total={dailyGoal.protein}
                            unit="g"
                            color={COLORS.primary}
                        />
                        <MacroRing
                            label="Calories"
                            current={currentTotals.calories}
                            total={dailyGoal.calories}
                            unit="kcal"
                            color={COLORS.secondary}
                        />
                    </View>
                </View>

                <View style={styles.actionZone}>
                    <Text style={styles.promptText}>What did you eat?</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 2 eggs and toast..."
                            placeholderTextColor={COLORS.textSecondary}
                            value={mealInput}
                            onChangeText={setMealInput}
                            multiline
                            onSubmitEditing={handleLogMeal}
                        />
                        <TouchableOpacity style={styles.logButton} onPress={handleLogMeal} disabled={isLoading}>
                            {isLoading ? <ActivityIndicator color={COLORS.background} size="small" /> : <Plus color={COLORS.background} size={24} />}
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.historyZone}>
                    <Text style={styles.historyTitle}>Today's Meals</Text>
                    {meals.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No meals logged yet. Add your first meal above!</Text>
                        </View>
                    ) : (
                        meals.map((meal, idx) => (
                            <View key={idx} style={styles.mealCard}>
                                <Text style={styles.mealText} numberOfLines={2}>{meal.name}</Text>
                                <View style={styles.macroPill}>
                                    <Text style={styles.macroText}>{meal.calories} kcal | {meal.protein}g P</Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    content: { padding: SIZES.padding, paddingBottom: 100 },
    header: { marginTop: SIZES.small },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: SIZES.base },
    streakPill: { backgroundColor: COLORS.cardDark, borderWidth: 1, borderColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
    streakPillText: { color: COLORS.primary, fontWeight: FONTS.bold as any, fontSize: SIZES.small },
    profileButton: { padding: SIZES.base, backgroundColor: COLORS.cardDark, borderRadius: 20 },
    dateText: { fontSize: SIZES.extraLarge, fontWeight: FONTS.bold as any, color: COLORS.textPrimary },
    subHeaderText: { fontSize: SIZES.medium, color: COLORS.textSecondary, marginBottom: SIZES.large },
    ringsContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: SIZES.small, marginBottom: SIZES.extraLarge },
    actionZone: { marginBottom: SIZES.extraLarge },
    promptText: { color: COLORS.textPrimary, fontSize: SIZES.medium, fontWeight: FONTS.semiBold as any, marginBottom: SIZES.small },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardDark, borderRadius: SIZES.radius, paddingRight: 6 },
    input: { flex: 1, color: COLORS.textPrimary, padding: SIZES.padding, fontSize: SIZES.medium, minHeight: 60 },
    logButton: { backgroundColor: COLORS.primary, width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    historyZone: { flex: 1 },
    historyTitle: { color: COLORS.textSecondary, fontSize: SIZES.small, fontWeight: FONTS.semiBold as any, textTransform: 'uppercase', marginBottom: SIZES.medium, letterSpacing: 1 },
    emptyState: { backgroundColor: COLORS.cardDark, borderRadius: SIZES.radius, padding: SIZES.padding, alignItems: 'center' },
    emptyText: { color: COLORS.textSecondary, textAlign: 'center', fontSize: SIZES.medium },
    mealCard: { backgroundColor: COLORS.cardWhite, borderRadius: SIZES.radius, padding: SIZES.padding, marginBottom: SIZES.small, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    mealText: { flex: 1, color: COLORS.textDark, fontSize: SIZES.medium, fontWeight: FONTS.semiBold as any, marginRight: SIZES.small },
    macroPill: { backgroundColor: '#F0F0F0', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
    macroText: { color: COLORS.textDark, fontSize: 12, fontWeight: FONTS.semiBold as any },
});
