import React, { memo } from 'react';
import { StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { theme } from '../utils/theme';
import { useAccessibility } from '../utils/accessibility';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface EnhancedButtonProps {
  accessibilityHint?: string;
  accessibilityLabel?: string;
  buttonColor?: string;
  children: React.ReactNode;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: string;
  loading?: boolean;
  mode?: string;
  onPress: () => void;
  size?: ButtonSize;
  style?: ViewStyle;
  testID?: string;
  textColor?: string;
  textStyle?: TextStyle;
  variant?: ButtonVariant;
}

const EnhancedButton: React.FC<EnhancedButtonProps> = memo(({
  accessibilityHint,
  accessibilityLabel,
  buttonColor,
  children,
  disabled = false,
  fullWidth = false,
  icon: _icon,
  loading = false,
  mode: _mode,
  onPress,
  size = 'md',
  style,
  testID,
  textColor,
  textStyle,
  variant = 'primary',
}) => {
  const { reduceMotionEnabled } = useAccessibility();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: reduceMotionEnabled ? 1 : scale.value }],
  }), [reduceMotionEnabled]);

  const handlePressIn = () => {
    if (disabled || loading || reduceMotionEnabled) return;
    scale.value = withTiming(0.97, { duration: 150 });
  };

  const handlePressOut = () => {
    if (disabled || loading || reduceMotionEnabled) return;
    scale.value = withTiming(1, { duration: 150 });
  };

  const buttonStyles = React.useMemo((): ViewStyle => {
    const sizeStyles = getSizeStyles(size);
    const variantStyles = getVariantStyles(variant);
    const stateStyles = getStateStyles(disabled);

    return {
      backgroundColor: buttonColor || variantStyles.backgroundColor,
      borderRadius: theme.borderRadius.md,
      ...sizeStyles,
      ...variantStyles,
      ...stateStyles,
      width: fullWidth ? '100%' : undefined,
    };
  }, [size, variant, fullWidth, disabled, buttonColor]);

  const textStyles = React.useMemo((): TextStyle => {
    const sizeTextStyles = getSizeTextStyles(size);
    const variantTextStyles = getVariantTextStyles(variant);

    return {
      ...sizeTextStyles,
      ...variantTextStyles,
      color: textColor || variantTextStyles.color,
    };
  }, [size, variant, textColor]);

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[styles.button, buttonStyles, style]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
        accessibilityLabel={accessibilityLabel || (typeof children === 'string' ? children : 'Button')}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
        accessibilityState={{ 
          disabled: disabled || loading,
          busy: loading, 
        }}
        testID={testID}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {loading ? (
          <ActivityIndicator 
            size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} 
            color={getVariantTextStyles(variant).color as string}
          />
        ) : (
          <Text style={[textStyles, textStyle]}>
            {children}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

const getSizeStyles = (size: ButtonSize): ViewStyle => {
  switch (size) {
    case 'sm':
      return {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        minHeight: 44,
      };
    case 'lg':
      return {
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
        minHeight: 52,
      };
    default: // md
      return {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        minHeight: 44,
      };
  }
};

const getSizeTextStyles = (size: ButtonSize): TextStyle => {
  switch (size) {
    case 'sm':
      return {
        fontSize: theme.typography.fontSizes.sm,
        fontWeight: theme.typography.fontWeights.medium,
      };
    case 'lg':
      return {
        fontSize: theme.typography.fontSizes.lg,
        fontWeight: theme.typography.fontWeights.semibold,
      };
    default: // md
      return {
        fontSize: theme.typography.fontSizes.base,
        fontWeight: theme.typography.fontWeights.medium,
      };
  }
};

const getVariantStyles = (variant: ButtonVariant): ViewStyle => {
  switch (variant) {
    case 'primary':
      return {
        backgroundColor: theme.colors.primary,
        ...theme.shadows.subtle,
      };
    case 'secondary':
      return {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
      };
    case 'ghost':
      return {
        backgroundColor: theme.colors.transparent,
      };
    default:
      return {
        backgroundColor: theme.colors.primary,
        ...theme.shadows.subtle,
      };
  }
};

const getVariantTextStyles = (variant: ButtonVariant): TextStyle => {
  switch (variant) {
    case 'primary':
      return {
        color: theme.colors.onPrimary,
      };
    case 'secondary':
      return {
        color: theme.colors.onSurface,
      };
    case 'ghost':
      return {
        color: theme.colors.primary,
      };
    default:
      return {
        color: theme.colors.onPrimary,
      };
  }
};

const getStateStyles = (disabled: boolean): ViewStyle => {
  return {
    opacity: disabled ? 0.6 : 1,
  };
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
});

export default EnhancedButton;