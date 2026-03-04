import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SIZES, FONTS } from '../constants/theme';

export function OnboardingScreen() {
    const navigation = useNavigation<any>();

    const [step, setStep] = useState<1 | 2>(1);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    // Step 2: Goals
    const [proteinGoal, setProteinGoal] = useState('150');
    const [calorieGoal, setCalorieGoal] = useState('2500');
    const [weight, setWeight] = useState('70');
    const [loading, setLoading] = useState(false);

    const handleStep1Next = () => {
        if (!name.trim() || !email.trim() || !password.trim()) {
            Alert.alert('Required', 'Please fill in all fields to continue.');
            return;
        }
        setStep(2);
    };

    const handleComplete = async () => {
        if (!proteinGoal || !calorieGoal || !weight) {
            Alert.alert('Required', 'Please fill in all body metrics.');
            return;
        }
        setLoading(true);
        try {
            // 1. Create Supabase Auth account
            const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
            if (error) throw error;

            const userId = data.user?.id;
            if (!userId) throw new Error('No user ID returned.');

            // 2. Save profile to profiles table
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    display_name: name.trim(),
                    weight_kg: parseFloat(weight),
                    daily_protein_goal: parseInt(proteinGoal),
                    daily_calorie_goal: parseInt(calorieGoal),
                });
            if (profileError) throw profileError;

            // AppNavigator picks up the session automatically via onAuthStateChange
        } catch (e: any) {
            Alert.alert('Sign Up Failed', e.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

                    <View style={styles.brandZone}>
                        <Text style={styles.appName}>ProCal</Text>
                        <Text style={styles.tagline}>
                            {step === 1 ? 'AI-Powered Macro Tracker' : 'Set Your Daily Targets'}
                        </Text>
                    </View>

                    <View style={styles.stepRow}>
                        <View style={[styles.stepDot, step === 1 && styles.stepDotActive]} />
                        <View style={styles.stepLine} />
                        <View style={[styles.stepDot, step === 2 && styles.stepDotActive]} />
                    </View>

                    {step === 1 ? (
                        <View style={styles.form}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Display Name</Text>
                                <TextInput style={styles.input} placeholder="e.g. Deku" placeholderTextColor={COLORS.textSecondary} value={name} onChangeText={setName} autoCapitalize="words" />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email</Text>
                                <TextInput style={styles.input} placeholder="you@example.com" placeholderTextColor={COLORS.textSecondary} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Password</Text>
                                <TextInput style={styles.input} placeholder="Create a password" placeholderTextColor={COLORS.textSecondary} value={password} onChangeText={setPassword} secureTextEntry />
                            </View>
                            <TouchableOpacity style={styles.actionButton} onPress={handleStep1Next}>
                                <Text style={styles.actionButtonText}>Continue →</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => navigation.navigate('SignIn')} style={styles.linkBtn}>
                                <Text style={styles.linkText}>Already have an account? <Text style={styles.linkHighlight}>Sign In</Text></Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.form}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Current Weight (kg)</Text>
                                <TextInput style={styles.input} placeholder="e.g. 70" placeholderTextColor={COLORS.textSecondary} value={weight} onChangeText={setWeight} keyboardType="numeric" />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Daily Protein Goal (g)</Text>
                                <TextInput style={styles.input} placeholder="e.g. 150" placeholderTextColor={COLORS.textSecondary} value={proteinGoal} onChangeText={setProteinGoal} keyboardType="numeric" />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Daily Calorie Goal (kcal)</Text>
                                <TextInput style={styles.input} placeholder="e.g. 2500" placeholderTextColor={COLORS.textSecondary} value={calorieGoal} onChangeText={setCalorieGoal} keyboardType="numeric" />
                            </View>
                            <TouchableOpacity style={[styles.actionButton, loading && { opacity: 0.7 }]} onPress={handleComplete} disabled={loading}>
                                <Text style={styles.actionButtonText}>{loading ? 'Creating Account...' : 'Get Started 🚀'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setStep(1)} style={styles.linkBtn}>
                                <Text style={styles.linkText}>← Back</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    content: { flexGrow: 1, padding: SIZES.padding, justifyContent: 'center' },
    brandZone: { marginBottom: SIZES.extraLarge },
    appName: { fontSize: 52, fontWeight: FONTS.bold as any, color: COLORS.primary, letterSpacing: -1 },
    tagline: { fontSize: SIZES.medium, color: COLORS.textSecondary, marginTop: 4, letterSpacing: 1 },
    stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.extraLarge },
    stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.cardDark, borderWidth: 1.5, borderColor: COLORS.textSecondary },
    stepDotActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    stepLine: { flex: 1, height: 1.5, backgroundColor: COLORS.cardDark, marginHorizontal: 6 },
    form: { gap: 4 },
    inputGroup: { marginBottom: SIZES.medium },
    label: { color: COLORS.textPrimary, fontSize: SIZES.medium, marginBottom: SIZES.small, fontWeight: FONTS.semiBold as any },
    input: { backgroundColor: COLORS.cardDark, color: COLORS.textPrimary, paddingHorizontal: SIZES.padding, paddingVertical: 16, borderRadius: SIZES.radius, fontSize: SIZES.medium },
    actionButton: { backgroundColor: COLORS.primary, padding: SIZES.padding, borderRadius: SIZES.radius, alignItems: 'center', marginTop: SIZES.large, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 10 },
    actionButtonText: { color: COLORS.background, fontSize: SIZES.large, fontWeight: FONTS.bold as any },
    linkBtn: { alignItems: 'center', marginTop: SIZES.medium, padding: 8 },
    linkText: { color: COLORS.textSecondary, fontSize: SIZES.medium },
    linkHighlight: { color: COLORS.primary, fontWeight: FONTS.bold as any },
});
