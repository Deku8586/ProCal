import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Save, Camera, LogOut } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { supabase } from '../services/supabase';

export function ProfileScreen() {
    const navigation = useNavigation<any>();
    const [isEditing, setIsEditing] = useState(false);

    // User identity
    const [userName, setUserName] = useState('');
    const [email, setEmail] = useState('');
    const [avatarUri, setAvatarUri] = useState<string | null>(null);

    // Metrics / Goals
    const [proteinGoal, setProteinGoal] = useState('150');
    const [calorieGoal, setCalorieGoal] = useState('2500');
    const [weight, setWeight] = useState('70');

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            setEmail(user.email ?? '');

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profile) {
                setUserName(profile.display_name ?? '');
                setWeight(String(profile.weight_kg ?? '70'));
                setProteinGoal(String(profile.daily_protein_goal ?? '150'));
                setCalorieGoal(String(profile.daily_calorie_goal ?? '2500'));
            }
        } catch (e) {
            console.error('Failed to load profile', e);
        }
    };

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Please grant camera roll access to set a profile photo.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.6,
        });
        if (!result.canceled && result.assets[0]) {
            setAvatarUri(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!userName.trim()) {
            Alert.alert('Name Required', 'Please enter a display name.');
            return;
        }
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    display_name: userName.trim(),
                    weight_kg: parseFloat(weight),
                    daily_protein_goal: parseInt(proteinGoal),
                    daily_calorie_goal: parseInt(calorieGoal),
                });
            if (error) throw error;

            setIsEditing(false);
            Alert.alert('Saved!', 'Your profile has been updated.');
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Could not save profile.');
        }
    };

    const handleLogout = () => {
        Alert.alert('Log Out', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Log Out',
                style: 'destructive',
                onPress: async () => {
                    await supabase.auth.signOut();
                    // AppNavigator detects session change automatically
                },
            },
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft color={COLORS.textPrimary} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <TouchableOpacity onPress={() => isEditing ? handleSave() : setIsEditing(true)} style={styles.editHeaderBtn}>
                    <Text style={styles.editHeaderText}>{isEditing ? 'Save' : 'Edit'}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <TouchableOpacity style={styles.avatarWrapper} onPress={isEditing ? handlePickImage : undefined} activeOpacity={isEditing ? 0.7 : 1}>
                        {avatarUri ? (
                            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                        ) : (
                            <View style={styles.avatarCircle}>
                                <Text style={styles.avatarText}>{(userName || email).charAt(0).toUpperCase()}</Text>
                            </View>
                        )}
                        {isEditing && (
                            <View style={styles.cameraOverlay}>
                                <Camera color="#fff" size={22} />
                            </View>
                        )}
                    </TouchableOpacity>

                    {isEditing ? (
                        <TextInput style={styles.nameInput} value={userName} onChangeText={setUserName} placeholder="Your display name" placeholderTextColor={COLORS.textSecondary} maxLength={30} />
                    ) : (
                        <>
                            <Text style={styles.userName}>{userName || 'ProCal Athlete'}</Text>
                            <Text style={styles.userSubtitle}>{email}</Text>
                        </>
                    )}
                </View>

                {/* Daily Targets Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Daily Targets</Text>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Protein Goal (g)</Text>
                        {isEditing ? <TextInput style={styles.input} value={proteinGoal} onChangeText={setProteinGoal} keyboardType="numeric" /> : <Text style={styles.readOnlyText}>{proteinGoal} g</Text>}
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Calorie Goal (kcal)</Text>
                        {isEditing ? <TextInput style={styles.input} value={calorieGoal} onChangeText={setCalorieGoal} keyboardType="numeric" /> : <Text style={styles.readOnlyText}>{calorieGoal} kcal</Text>}
                    </View>
                </View>

                {/* Body Metrics Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Body Metrics</Text>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Current Weight (kg)</Text>
                        {isEditing ? <TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="numeric" /> : <Text style={styles.readOnlyText}>{weight} kg</Text>}
                    </View>
                </View>

                {isEditing ? (
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => { setIsEditing(false); loadProfile(); }}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <Save color={COLORS.background} size={18} style={{ marginRight: 6 }} />
                            <Text style={styles.saveBtnText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <LogOut color={COLORS.error} size={18} style={{ marginRight: 6 }} />
                        <Text style={styles.logoutBtnText}>Log Out</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SIZES.padding, marginTop: SIZES.small, marginBottom: SIZES.large },
    backBtn: { padding: SIZES.base, marginLeft: -SIZES.base },
    headerTitle: { fontSize: SIZES.large, fontWeight: FONTS.bold as any, color: COLORS.textPrimary },
    editHeaderBtn: { paddingVertical: 6, paddingHorizontal: 14, backgroundColor: COLORS.cardDark, borderRadius: 12 },
    editHeaderText: { color: COLORS.primary, fontWeight: FONTS.bold as any, fontSize: SIZES.medium },
    content: { padding: SIZES.padding, paddingBottom: 40 },
    avatarSection: { alignItems: 'center', marginBottom: SIZES.extraLarge },
    avatarWrapper: { position: 'relative', marginBottom: SIZES.medium },
    avatarCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
    avatarImage: { width: 90, height: 90, borderRadius: 45 },
    avatarText: { fontSize: 36, fontWeight: FONTS.bold as any, color: COLORS.background },
    cameraOverlay: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.primary, width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.background },
    nameInput: { marginTop: SIZES.small, color: COLORS.textPrimary, fontSize: SIZES.large, fontWeight: FONTS.bold as any, backgroundColor: COLORS.cardDark, paddingHorizontal: SIZES.padding, paddingVertical: 10, borderRadius: SIZES.radius, textAlign: 'center', minWidth: 200 },
    userName: { fontSize: SIZES.large, fontWeight: FONTS.bold as any, color: COLORS.textPrimary },
    userSubtitle: { fontSize: SIZES.medium, color: COLORS.textSecondary, marginTop: 4 },
    card: { backgroundColor: COLORS.cardDark, padding: SIZES.padding, borderRadius: SIZES.radius, marginBottom: SIZES.large },
    cardTitle: { fontSize: SIZES.medium, fontWeight: FONTS.bold as any, color: COLORS.textSecondary, marginBottom: SIZES.large, textTransform: 'uppercase', letterSpacing: 1 },
    inputGroup: { marginBottom: SIZES.medium },
    label: { color: COLORS.textPrimary, fontSize: SIZES.medium, marginBottom: SIZES.small, fontWeight: FONTS.semiBold as any },
    input: { backgroundColor: COLORS.cardWhite, color: COLORS.textDark, paddingHorizontal: SIZES.padding, paddingVertical: 12, borderRadius: SIZES.base, fontSize: SIZES.medium, fontWeight: FONTS.semiBold as any },
    readOnlyText: { color: COLORS.textPrimary, fontSize: SIZES.large, fontWeight: FONTS.bold as any, marginTop: 4 },
    actionRow: { flexDirection: 'row', gap: 12 },
    cancelButton: { flex: 1, backgroundColor: COLORS.cardDark, borderColor: COLORS.textSecondary, borderWidth: 1, padding: SIZES.padding, borderRadius: SIZES.radius, alignItems: 'center' },
    cancelBtnText: { color: COLORS.textSecondary, fontSize: SIZES.medium, fontWeight: FONTS.semiBold as any },
    saveButton: { flex: 1, backgroundColor: COLORS.primary, flexDirection: 'row', padding: SIZES.padding, borderRadius: SIZES.radius, alignItems: 'center', justifyContent: 'center' },
    saveBtnText: { color: COLORS.background, fontSize: SIZES.medium, fontWeight: FONTS.bold as any },
    logoutButton: { backgroundColor: COLORS.cardDark, borderColor: COLORS.error, borderWidth: 1, flexDirection: 'row', padding: SIZES.padding, borderRadius: SIZES.radius, alignItems: 'center', justifyContent: 'center' },
    logoutBtnText: { color: COLORS.error, fontSize: SIZES.medium, fontWeight: FONTS.bold as any },
});
