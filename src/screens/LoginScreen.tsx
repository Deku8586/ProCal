import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { COLORS, SIZES, FONTS } from '../constants/theme';

export function LoginScreen({ navigation }: any) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        // Basic bypass for now to test flow
        navigation.navigate('MainTabs');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>NUTRITION</Text>
                <Text style={styles.subtitle}>AI MACRO TRACKER</Text>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor={COLORS.textSecondary}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor={COLORS.textSecondary}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>

                <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                    <Text style={styles.loginButtonText}>Sign In</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
        padding: SIZES.padding,
        justifyContent: 'center',
    },
    title: {
        fontSize: SIZES.massive,
        fontWeight: FONTS.bold as any,
        color: COLORS.primary,
        marginBottom: SIZES.small,
    },
    subtitle: {
        fontSize: SIZES.large,
        color: COLORS.textSecondary,
        marginBottom: SIZES.extraLarge * 2,
        letterSpacing: 2,
    },
    inputContainer: {
        marginBottom: SIZES.extraLarge,
    },
    input: {
        backgroundColor: COLORS.cardDark,
        color: COLORS.textPrimary,
        padding: SIZES.padding,
        borderRadius: SIZES.radius,
        marginBottom: SIZES.medium,
        fontSize: SIZES.medium,
    },
    loginButton: {
        backgroundColor: COLORS.primary,
        padding: SIZES.padding,
        borderRadius: 30, // Pill shape
        alignItems: 'center',
    },
    loginButtonText: {
        color: COLORS.background,
        fontSize: SIZES.large,
        fontWeight: FONTS.bold as any,
    },
});
