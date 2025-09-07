import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { EnhancedCard } from '../../components';
import { theme } from '../../utils/theme';
import { DURATIONS, EASING } from '../../utils/animations';

const { width } = Dimensions.get('window');

interface OnboardingScreenProps {
  title: string;
  description: string;
  illustration?: string;
  isActive?: boolean; // To trigger entrance animations
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  title,
  description,
  illustration = '🌙',
  isActive = false,
}) => {
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(30);
  const illustrationScale = useSharedValue(0.8);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const descriptionOpacity = useSharedValue(0);
  const descriptionTranslateY = useSharedValue(20);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const illustrationAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: illustrationScale.value }],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const descriptionAnimatedStyle = useAnimatedStyle(() => ({
    opacity: descriptionOpacity.value,
    transform: [{ translateY: descriptionTranslateY.value }],
  }));

  useEffect(() => {
    if (isActive) {
      // Staggered entrance animations
      cardOpacity.value = withTiming(1, {
        duration: DURATIONS.normal,
        easing: EASING,
      });
      cardTranslateY.value = withTiming(0, {
        duration: DURATIONS.normal,
        easing: EASING,
      });

      illustrationScale.value = withDelay(
        100,
        withSequence(
          withTiming(1.1, { duration: DURATIONS.fast, easing: EASING }),
          withTiming(1, { duration: DURATIONS.fast, easing: EASING }),
        ),
      );

      titleOpacity.value = withDelay(
        200,
        withTiming(1, { duration: DURATIONS.normal, easing: EASING }),
      );
      titleTranslateY.value = withDelay(
        200,
        withTiming(0, { duration: DURATIONS.normal, easing: EASING }),
      );

      descriptionOpacity.value = withDelay(
        350,
        withTiming(1, { duration: DURATIONS.normal, easing: EASING }),
      );
      descriptionTranslateY.value = withDelay(
        350,
        withTiming(0, { duration: DURATIONS.normal, easing: EASING }),
      );
    } else {
      // Reset animations when not active
      cardOpacity.value = 0;
      cardTranslateY.value = 30;
      illustrationScale.value = 0.8;
      titleOpacity.value = 0;
      titleTranslateY.value = 20;
      descriptionOpacity.value = 0;
      descriptionTranslateY.value = 20;
    }
  }, [
    cardOpacity,
    cardTranslateY,
    descriptionOpacity,
    descriptionTranslateY,
    illustrationScale,
    isActive,
    titleOpacity,
    titleTranslateY,
  ]);

  return (
    <View style={styles.container}>
      <Animated.View style={cardAnimatedStyle}>
        <EnhancedCard variant="elevated" padding="lg" style={styles.card}>
          {/* Enhanced illustration with animation */}
          <Animated.View
            style={[styles.illustrationContainer, illustrationAnimatedStyle]}
          >
            <View style={styles.illustrationPlaceholder}>
              <Text style={styles.illustrationText}>{illustration}</Text>
            </View>
          </Animated.View>

          {/* Enhanced title with animation */}
          <Animated.View style={titleAnimatedStyle}>
            <Text variant="headlineMedium" style={styles.title}>
              {title}
            </Text>
          </Animated.View>

          {/* Enhanced description with animation */}
          <Animated.View style={descriptionAnimatedStyle}>
            <Text variant="bodyLarge" style={styles.description}>
              {description}
            </Text>
          </Animated.View>
        </EnhancedCard>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderColor: `${theme.colors.outline}08`,
    borderWidth: 1,
    maxWidth: 380,
    width: '100%', // Very subtle border
  },
  container: {
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    width,
  },
  description: {
    color: theme.colors.onSurfaceVariant,
    fontSize: theme.typography.fontSizes.lg,
    letterSpacing: 0.1,
    lineHeight:
      theme.typography.fontSizes.lg * theme.typography.lineHeights.normal,
    paddingHorizontal: theme.spacing.sm,
    textAlign: 'center', // Subtle letter spacing for readability
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  illustrationPlaceholder: {
    alignItems: 'center',
    backgroundColor: theme.colorPalette.primary[50],
    borderColor: theme.colorPalette.primary[100],
    borderRadius: 70,
    borderWidth: 2, // Slightly thinner border
    elevation: theme.shadows.lg.elevation, // Stronger shadow for better depth
    height: 140,
    justifyContent: 'center',
    shadowColor: theme.shadows.lg.shadowColor,
    shadowOffset: theme.shadows.lg.shadowOffset,
    shadowOpacity: theme.shadows.lg.shadowOpacity,
    shadowRadius: theme.shadows.lg.shadowRadius,
    width: 140,
  },
  illustrationText: {
    fontSize: 56,
    textShadowColor: theme.colors.textShadowSubtle,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  title: {
    color: theme.colors.onSurface,
    fontSize: theme.typography.fontSizes['2xl'],
    fontWeight: theme.typography.fontWeights.bold,
    letterSpacing: -0.3,
    lineHeight:
      theme.typography.fontSizes['2xl'] * theme.typography.lineHeights.tight,
    marginBottom: theme.spacing.lg,
    textAlign: 'center', // Tighter spacing for headings
  },
});

export default OnboardingScreen;
