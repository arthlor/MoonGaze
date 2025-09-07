import React from 'react';
import { StyleSheet } from 'react-native';
import { FAB } from 'react-native-paper';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { theme } from '../utils/theme';
import { DURATIONS, EASING, pressAnimation, releaseAnimation } from '../utils/animations';

interface FloatingActionButtonProps {
  onPress: () => void;
  icon?: string;
  label?: string;
  visible?: boolean;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  icon = 'plus',
  label,
  visible = true,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(visible ? 1 : 0);

  // Enhanced animation styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // Simplified press animation
  const handlePress = () => {
    pressAnimation(scale);
    setTimeout(() => {
      releaseAnimation(scale);
      onPress();
    }, DURATIONS.fast);
  };

  // Visibility animation
  React.useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, {
      duration: DURATIONS.normal,
      easing: EASING,
    });
  }, [visible, opacity]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.fabContainer, animatedStyle]}>
      <FAB
        icon={icon}
        label={label}
        onPress={handlePress}
        style={styles.fabButton}
        color={theme.colors.onPrimary}
        customSize={56}
        mode="elevated"
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fabButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    elevation: theme.shadows.lg.elevation,
    shadowColor: theme.shadows.lg.shadowColor,
    shadowOffset: theme.shadows.lg.shadowOffset,
    shadowOpacity: theme.shadows.lg.shadowOpacity,
    shadowRadius: theme.shadows.lg.shadowRadius,
  },
  fabContainer: {
    // Container handles positioning, animation handles transforms
  },
});

export default FloatingActionButton;