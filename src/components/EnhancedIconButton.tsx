import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { IconButton } from 'react-native-paper';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { theme } from '../utils/theme';
import { DURATIONS, EASING, SCALES } from '../utils/animations';

export type IconButtonVariant = 'primary' | 'secondary' | 'ghost';
export type IconButtonSize = 'sm' | 'md' | 'lg';

interface EnhancedIconButtonProps {
  icon: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  disabled?: boolean;
  onPress: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

const EnhancedIconButton: React.FC<EnhancedIconButtonProps> = ({
  icon,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  onPress,
  style,
  accessibilityLabel,
  accessibilityHint,
  testID,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withTiming(SCALES.press, { 
      duration: DURATIONS.fast, 
      easing: EASING, 
    });
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withTiming(1, { 
      duration: DURATIONS.fast, 
      easing: EASING, 
    });
  };

  const handlePress = () => {
    if (disabled) return;
    onPress();
  };

  const getButtonStyles = (): ViewStyle => {
    const sizeStyles = getSizeStyles(size);
    const variantStyles = getVariantStyles(variant);

    const stateStyles = getStateStyles(disabled);
    
    return {
      ...sizeStyles,
      ...variantStyles,
      ...stateStyles,
      borderRadius: theme.borderRadius.full,
    };
  };

  const getIconColor = (): string => {
    return getVariantIconColor(variant);
  };

  const getIconSize = (): number => {
    switch (size) {
      case 'sm':
        return 18;
      case 'lg':
        return 28;
      default: // md
        return 24;
    }
  };

  return (
    <Animated.View style={[animatedStyle, getButtonStyles(), style]}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={1}
        accessibilityLabel={accessibilityLabel || `${icon} button`}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        testID={testID}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.touchable}
      >
        <IconButton
          icon={icon}
          size={getIconSize()}
          iconColor={getIconColor()}
          style={styles.iconButton}
          onPress={() => {}} // Handled by TouchableOpacity
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

const getSizeStyles = (size: IconButtonSize): ViewStyle => {
  switch (size) {
    case 'sm':
      return {
        width: 44, // Ensure minimum 44pt touch target
        height: 44,
      };
    case 'lg':
      return {
        width: 56,
        height: 56,
      };
    default: // md
      return {
        width: 44, // Ensure minimum 44pt touch target
        height: 44,
      };
  }
};

const getVariantStyles = (variant: IconButtonVariant): ViewStyle => {
  switch (variant) {
    case 'primary':
      return {
        backgroundColor: theme.colors.primary,
      };
    case 'secondary':
      return {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
      };
    default: // ghost
      return {
        backgroundColor: theme.colors.transparent,
      };
  }
};

const getVariantIconColor = (variant: IconButtonVariant): string => {
  switch (variant) {
    case 'primary':
      return theme.colors.onPrimary;
    case 'secondary':
      return theme.colors.primary;
    default: // ghost
      return theme.colors.onSurface;
  }
};

const getStateStyles = (disabled: boolean): ViewStyle => {
  return {
    opacity: disabled ? 0.6 : 1,
  };
};

const styles = StyleSheet.create({
  iconButton: {
    margin: 0,
  },
  touchable: {
    alignItems: 'center',
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
  },
});

export default EnhancedIconButton;