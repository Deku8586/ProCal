import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SIZES, FONTS } from '../constants/theme';

export function SignInScreen() {
    const navigation = useNavigation<any>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignIn = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Required', 'Please enter your email and password.');
            return;
        }
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });
            if (error) throw error;
            // AppNavigator detects session via onAuthStateChange automatically
        } catch (e: any) {
            Alert.alert('Sign In Failed', e.message || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.content}>
                    <View style={styles.brandZone}>
                        <Text style={styles.appName}>ProCal</Text>
                        <Text style={styles.tagline}>Welcome back 👋</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="you@example.com"
                                placeholderTextColor={COLORS.textSecondary}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Password</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Your password"
                                placeholderTextColor={COLORS.textSecondary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.actionButton, loading && { opacity: 0.7 }]}
                            onPress={handleSignIn}
                            disabled={loading}
                        >
                            <Text style={styles.actionButtonText}>{loading ? 'Signing In...' : 'Sign In'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => navigation.navigate('Onboarding')} style={styles.linkBtn}>
                            <Text style={styles.linkText}>
                                New here? <Text style={styles.linkHighlight}>Create an account</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    content: { flex: 1, padding: SIZES.padding, justifyContent: 'center' },
    brandZone: { marginBottom: SIZES.extraLarge * 1.5 },
    appName: { fontSize: 52, fontWeight: FONTS.bold as any, color: COLORS.primary, letterSpacing: -1 },
    tagline: { fontSize: SIZES.large, color: COLORS.textSecondary, marginTop: 4 },
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
