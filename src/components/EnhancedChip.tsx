import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { theme } from '../utils/theme';
import { pressAnimation, releaseAnimation } from '../utils/animations';
import { useAccessibility } from '../utils/accessibility';

export type ChipVariant = 'filter' | 'selection';
export type ChipSize = 'md' | 'lg';

interface EnhancedChipProps {
  accessibilityHint?: string;
  accessibilityLabel?: string;
  accessibilityRole?: string;
  children: React.ReactNode;
  disabled?: boolean;
  icon?: string;
  onClose?: () => void;
  onPress?: () => void;
  selected?: boolean;
  selectedColor?: string;
  size?: ChipSize;
  style?: ViewStyle;
  testID?: string;
  variant?: ChipVariant;
}

const EnhancedChip: React.FC<EnhancedChipProps> = ({
  accessibilityHint,
  accessibilityLabel,
  accessibilityRole,
  children,
  disabled = false,
  icon,
  onClose,
  onPress,
  selected = false,
  selectedColor,
  size = 'md',
  style,
  testID,
  variant = 'filter',
}) => {
  const { reduceMotionEnabled } = useAccessibility();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: reduceMotionEnabled ? 1 : scale.value }],
  }));

  const handlePress = () => {
    if (disabled || !onPress) return;
    
    if (!reduceMotionEnabled) {
      pressAnimation(scale);
      setTimeout(() => {
        releaseAnimation(scale);
      }, 150);
    }
    onPress();
  };

  const getChipStyles = (): ViewStyle => {
    const baseStyles: ViewStyle = {
      borderRadius: theme.borderRadius.full,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44, // Accessibility requirement
      minWidth: 44, // Ensure minimum width for touch targets
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    };

    // Size adjustments
    if (size === 'lg') {
      baseStyles.minHeight = 48;
      baseStyles.minWidth = 48;
      baseStyles.paddingHorizontal = theme.spacing.lg;
      baseStyles.paddingVertical = theme.spacing.md;
    }

    const stateStyles = getStateStyles(disabled);
    
    // Variant and selection styles
    if (selected) {
      return {
        ...baseStyles,
        ...stateStyles,
        backgroundColor: selectedColor || theme.colors.primary,
        borderWidth: 0,
      };
    }

    return {
      ...baseStyles,
      ...stateStyles,
      backgroundColor: variant === 'selection' ? theme.colors.surface : theme.colors.transparent,
      borderWidth: 1,
      borderColor: theme.colors.border,
    };
  };

  const getTextColor = (): string => {
    if (selected) return theme.colors.onPrimary;
    return theme.colors.onSurface;
  };

  const getIconSize = (): number => {
    return size === 'lg' ? 20 : 16;
  };

  const renderContent = () => (
    <>
      {icon && (
        <Icon 
          source={icon} 
          size={getIconSize()} 
          color={getTextColor()}
        />
      )}
      <Text style={[
        styles.chipText,
        size === 'lg' ? styles.chipTextLarge : styles.chipTextMedium,
        { color: getTextColor() },
        icon ? styles.textWithIcon : null,
      ]}>
        {children}
      </Text>
      {onClose && (
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeButton}
          accessibilityLabel={`Remove ${typeof children === 'string' ? children : 'item'}`}
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon 
            source="close" 
            size={getIconSize()} 
            color={getTextColor()}
          />
        </TouchableOpacity>
      )}
    </>
  );

  // Accessibility helpers
  const getAccessibilityLabel = (): string => {
    let label = accessibilityLabel || (typeof children === 'string' ? children : 'Chip');
    if (variant === 'filter') {
      label += selected ? ', selected filter' : ', filter';
    } else if (variant === 'selection') {
      label += selected ? ', selected' : ', not selected';
    }
    return label;
  };

  const getAccessibilityHint = (): string => {
    if (accessibilityHint) return accessibilityHint;
    if (variant === 'filter') return 'Double tap to toggle filter';
    if (variant === 'selection') return 'Double tap to select';
    return 'Double tap to activate';
  };

  const getAccessibilityRole = (): 'button' | 'checkbox' => {
    if (accessibilityRole === 'button' || accessibilityRole === 'checkbox') return accessibilityRole;
    if (variant === 'filter' || variant === 'selection') return 'checkbox';
    return 'button';
  };

  if (onPress) {
    return (
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          style={[getChipStyles(), style]}
          onPress={handlePress}
          disabled={disabled}
          activeOpacity={0.8}
          accessibilityLabel={getAccessibilityLabel()}
          accessibilityHint={getAccessibilityHint()}
          accessibilityRole={getAccessibilityRole()}
          accessibilityState={{ 
            disabled, 
            checked: (variant === 'filter' || variant === 'selection') ? selected : undefined,
          }}
          testID={testID}
          hitSlop={{ top: 2, bottom: 2, left: 2, right: 2 }}
        >
          {renderContent()}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[animatedStyle, getChipStyles(), style]}>
      {renderContent()}
    </Animated.View>
  );
};

const getStateStyles = (disabled: boolean): ViewStyle => {
  return {
    opacity: disabled ? 0.6 : 1,
  };
};

const styles = StyleSheet.create({
  chipText: {
    fontWeight: theme.typography.weights.medium as '500',
  },
  chipTextLarge: {
    fontSize: theme.typography.sizes.base,
  },
  chipTextMedium: {
    fontSize: theme.typography.sizes.sm,
  },
  closeButton: {
    marginLeft: theme.spacing.xs,
    padding: 2,
  },
  textWithIcon: {
    marginLeft: theme.spacing.xs,
  },
});

export default EnhancedChip;