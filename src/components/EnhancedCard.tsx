import React from 'react';
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { theme } from '../utils/theme';
import { DURATIONS, EASING } from '../utils/animations';
import { useAccessibility } from '../utils/accessibility';
import { getShadow } from '../utils/shadowUtils';

// Simplified to only flat and elevated variants
export type CardVariant = 'flat' | 'elevated';
export type CardPadding = 'sm' | 'md' | 'lg';

interface EnhancedCardProps {
  variant?: CardVariant;
  padding?: CardPadding;
  interactive?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'none' | 'summary';
  testID?: string;
}

const EnhancedCard: React.FC<EnhancedCardProps> = ({
  variant = 'elevated',
  padding = 'md',
  interactive = false,
  onPress,
  children,
  style,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  testID,
}) => {
  const { reduceMotionEnabled } = useAccessibility();
  const scale = useSharedValue(1);

  // Simple animation for interactive cards
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: reduceMotionEnabled ? 1 : scale.value }],
  }));

  const handlePressIn = () => {
    if (!interactive || reduceMotionEnabled) return;
    scale.value = withTiming(0.98, { duration: DURATIONS.fast, easing: EASING });
  };

  const handlePressOut = () => {
    if (!interactive || reduceMotionEnabled) return;
    scale.value = withTiming(1, { duration: DURATIONS.fast, easing: EASING });
  };

  const handlePress = () => {
    if (onPress) onPress();
  };

  // Get card styles based on variant
  const getCardStyles = (): ViewStyle => {
    const baseStyles: ViewStyle = {
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.surface,
    };

    // Apply shadow only for elevated variant
    if (variant === 'elevated') {
      return {
        ...baseStyles,
        ...getShadow('subtle'), // Use minimal shadow
      };
    }

    return baseStyles;
  };

  // Get padding styles
  const getPaddingStyles = (): ViewStyle => {
    switch (padding) {
      case 'sm':
        return { padding: theme.spacing.sm };
      case 'lg':
        return { padding: theme.spacing.lg };
      default: // md
        return { padding: theme.spacing.md };
    }
  };

  const cardStyles = [
    styles.card,
    getCardStyles(),
    getPaddingStyles(),
    style,
  ];

  if (interactive && onPress) {
    return (
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
          accessibilityLabel={accessibilityLabel || 'Card'}
          accessibilityHint={accessibilityHint || 'Double tap to interact'}
          accessibilityRole={accessibilityRole || 'button'}
          testID={testID}
          style={cardStyles}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <View 
      style={cardStyles}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole || 'none'}
      testID={testID}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    // Clean, minimal card styling
  },
});

export default EnhancedCard;