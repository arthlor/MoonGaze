/**
 * Enhanced SplashScreen Component
 * 
 * Features:
 * - Engaging logo animations with pulse, rotation, and shimmer effects
 * - Modern visual feedback with loading indicators
 * - Smooth entrance and exit transitions
 * - Performance optimized with native driver animations
 * - Accessibility compliant with proper labels and roles
 * - Enhanced brand presentation with improved typography and spacing
 */
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { theme } from '../utils/theme';
import { DURATIONS, EASING } from '../utils/animations';

interface SplashScreenProps {
  onAnimationComplete?: () => void;
}

const { width } = Dimensions.get('window');

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onAnimationComplete,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Performance optimization: Use requestAnimationFrame for smooth animations
    let pulseAnimation: Animated.CompositeAnimation;
    let shimmerAnimation: Animated.CompositeAnimation;

    const startAnimations = () => {
      // Create engaging logo pulse animation
      pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            easing: EASING,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: EASING,
            useNativeDriver: true,
          }),
        ]),
      );

      // Create subtle shimmer effect
      shimmerAnimation = Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          easing: EASING,
          useNativeDriver: true,
        }),
      );
      
      pulseAnimation.start();
      shimmerAnimation.start();

      // Main entrance animation sequence with optimized timing
      const entranceSequence = Animated.sequence([
        // Initial fade in with logo scale and rotation
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: DURATIONS.normal * 2,
            easing: EASING,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(logoRotateAnim, {
            toValue: 1,
            duration: DURATIONS.normal * 3,
            easing: EASING,
            useNativeDriver: true,
          }),
        ]),
        // Slide up the text with stagger
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: DURATIONS.normal * 2,
          easing: EASING,
          useNativeDriver: true,
        }),
        // Optimized hold time for better UX
        Animated.delay(800),
        // Smooth exit
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: DURATIONS.normal,
          easing: EASING,
          useNativeDriver: true,
        }),
      ]);

      entranceSequence.start(() => {
        pulseAnimation?.stop();
        shimmerAnimation?.stop();
        onAnimationComplete?.();
      });
    };

    // Use requestAnimationFrame for better performance
    const animationFrame = requestAnimationFrame(startAnimations);

    // Cleanup function with proper animation stopping
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      pulseAnimation?.stop();
      shimmerAnimation?.stop();
    };
  }, [fadeAnim, scaleAnim, slideAnim, logoRotateAnim, pulseAnim, shimmerAnim, onAnimationComplete]);

  // Create interpolated values for smooth animations
  const logoRotation = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View 
      style={styles.container}
      accessible={true}
      accessibilityLabel="MoonGaze app loading screen"
      accessibilityRole="none"
    >
      <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
      
      {/* Enhanced background with gradient layers */}
      <View style={styles.backgroundGradient} />
      <View style={styles.backgroundOverlay} />
      
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
        accessible={true}
        accessibilityLabel="App logo and branding"
      >
        {/* Enhanced logo with multiple animation layers */}
        <View style={styles.logoContainer}>
          <Animated.View
            style={[
              styles.logo,
              {
                transform: [
                  { scale: pulseAnim },
                  { rotate: logoRotation },
                ],
              },
            ]}
            accessible={true}
            accessibilityLabel="MoonGaze logo"
            accessibilityRole="image"
          >
            <Text style={styles.logoText} accessible={false}>🌙</Text>
            
            {/* Shimmer overlay effect */}
            <Animated.View
              style={[
                styles.shimmerOverlay,
                {
                  transform: [{ translateX: shimmerTranslate }],
                },
              ]}
              accessible={false}
            />
          </Animated.View>
          
          {/* Subtle glow effect */}
          <View style={styles.logoGlow} accessible={false} />
        </View>

        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
          accessible={true}
          accessibilityLabel="MoonGaze - Shared responsibilities, shared success"
        >
          <Text 
            variant="headlineLarge" 
            style={styles.appName}
            accessible={true}
            accessibilityRole="header"
          >
            MoonGaze
          </Text>
          <Text 
            variant="bodyLarge" 
            style={styles.tagline}
            accessible={true}
          >
            Shared responsibilities, shared success
          </Text>
          
          {/* Loading indicator */}
          <View 
            style={styles.loadingContainer}
            accessible={true}
            accessibilityLabel="Loading"
            accessibilityRole="progressbar"
          >
            <Animated.View
              style={[
                styles.loadingDot,
                { opacity: pulseAnim },
              ]}
              accessible={false}
            />
            <Animated.View
              style={[
                styles.loadingDot,
                { 
                  opacity: pulseAnim,
                  transform: [{ scale: pulseAnim }],
                },
              ]}
              accessible={false}
            />
            <Animated.View
              style={[
                styles.loadingDot,
                { opacity: pulseAnim },
              ]}
              accessible={false}
            />
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  appName: {
    color: theme.colors.onPrimary,
    fontSize: theme.typography.fontSizes['3xl'],
    fontWeight: '700' as const,
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
    textAlign: 'center' as const,
  },
  backgroundGradient: {
    backgroundColor: theme.colorPalette.primary[500],
    bottom: 0,
    left: 0,
    position: 'absolute' as const,
    right: 0,
    top: 0,
    zIndex: 0,
  },
  backgroundOverlay: {
    backgroundColor: theme.colors.backdrop,
    bottom: 0,
    left: 0,
    position: 'absolute' as const,
    right: 0,
    top: 0,
    zIndex: 1,
  },
  container: {
    alignItems: 'center' as const,
    backgroundColor: theme.colors.primary,
    flex: 1,
    justifyContent: 'center' as const,
  },
  content: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    zIndex: 2,
  },
  loadingContainer: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    marginTop: theme.spacing.md,
  },
  loadingDot: {
    backgroundColor: theme.colors.onPrimary,
    borderRadius: 4,
    height: 8,
    marginHorizontal: 4,
    opacity: 0.7,
    width: 8,
  },
  logo: {
    alignItems: 'center' as const,
    backgroundColor: theme.colorPalette.surface.overlay,
    borderColor: theme.colors.onPrimary,
    borderRadius: 70,
    borderWidth: 2,
    elevation: theme.shadows.xl.elevation,
    height: 140,
    justifyContent: 'center' as const,
    opacity: 0.8,
    overflow: 'hidden' as const,
    shadowColor: theme.shadows.xl.shadowColor,
    shadowOffset: theme.shadows.xl.shadowOffset,
    shadowOpacity: theme.shadows.xl.shadowOpacity,
    shadowRadius: theme.shadows.xl.shadowRadius,
    width: 140,
  },
  logoContainer: {
    marginBottom: theme.spacing.xl,
    position: 'relative' as const,
  },
  logoGlow: {
    backgroundColor: theme.colors.onPrimary,
    borderRadius: 80,
    height: 160,
    left: -10,
    opacity: 0.1,
    position: 'absolute' as const,
    top: -10,
    width: 160,
    zIndex: -1,
  },
  logoText: {
    fontSize: 56,
    zIndex: 1,
  },
  shimmerOverlay: {
    backgroundColor: theme.colors.onPrimary,
    bottom: 0,
    left: 0,
    opacity: 0.3,
    position: 'absolute' as const,
    right: 0,
    top: 0,
    transform: [{ skewX: '-20deg' }],
    width: 40,
  },
  tagline: {
    color: theme.colors.onPrimary,
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: '300' as const,
    marginBottom: theme.spacing.lg,
    opacity: 0.85,
    textAlign: 'center' as const,
  },
  textContainer: {
    alignItems: 'center' as const,
    marginBottom: theme.spacing.xl,
  },
});