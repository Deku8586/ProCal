import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Calendar } from 'lucide-react-native';

import { OnboardingScreen } from '../screens/OnboardingScreen';
import { SignInScreen } from '../screens/SignInScreen';
import { TodayScreen } from '../screens/TodayScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { supabase } from '../services/supabase';
import { COLORS } from '../constants/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: COLORS.background,
                    borderTopColor: COLORS.cardDark,
                    paddingBottom: 20,
                    height: 80,
                },
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textSecondary,
            }}
        >
            <Tab.Screen
                name="Today"
                component={TodayScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Progress"
                component={ProgressScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
                }}
            />
        </Tab.Navigator>
    );
}

export function AppNavigator() {
    const [session, setSession] = useState<any>(undefined); // undefined = loading

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session ?? null);
        });

        // Listen for auth state changes (login/logout)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Show spinner while checking auth
    if (session === undefined) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', backgroundColor: COLORS.background }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {session ? (
                    // ── Authenticated ─────────────────────────────
                    <>
                        <Stack.Screen name="MainTabs" component={MainTabs} />
                        <Stack.Screen name="Profile" component={ProfileScreen} />
                    </>
                ) : (
                    // ── Unauthenticated ───────────────────────────
                    <>
                        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                        <Stack.Screen name="SignIn" component={SignInScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
