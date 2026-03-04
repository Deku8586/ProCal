import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS, SIZES, FONTS } from '../constants/theme';

interface MacroRingProps {
    label: string;
    current: number;
    total: number;
    unit?: string;
    size?: number;
    color?: string;
    showRemaining?: boolean;
}

export function MacroRing({
    label,
    current,
    total,
    unit = '',
    size = 140,
    color = COLORS.primary,
    showRemaining = false
}: MacroRingProps) {
    const strokeWidth = 14;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;

    // Cap calculation at 100% so the ring doesn't overlap weirdly
    const safeCurrent = Math.min(current, total);
    const strokeDashoffset = circumference - (safeCurrent / total) * circumference;

    const displayValue = showRemaining ? Math.max(0, total - current) : current;

    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Svg style={StyleSheet.absoluteFill}>
                {/* Background Track Circle */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={COLORS.cardDark}
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                {/* Progress Circle */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    rotation="-90"
                    originX={size / 2}
                    originY={size / 2}
                />
            </Svg>

            <View style={styles.centerContainer}>
                <Text style={styles.valueText}>
                    {displayValue}
                </Text>
                <Text style={styles.unitText}>{unit}</Text>
                <Text style={styles.labelText}>
                    {label.toUpperCase()}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    centerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    valueText: {
        fontSize: SIZES.extraLarge,
        fontWeight: FONTS.bold as any,
        color: COLORS.textPrimary,
    },
    unitText: {
        fontSize: SIZES.small,
        color: COLORS.textSecondary,
        marginTop: -4,
    },
    labelText: {
        fontSize: 10,
        color: COLORS.textSecondary,
        marginTop: 4,
        letterSpacing: 1,
    }
});
