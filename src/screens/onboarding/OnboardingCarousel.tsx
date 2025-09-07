import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import PagerView from 'react-native-pager-view';
import Animated, { 
  runOnJS, 
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { DURATIONS, EASING } from '../../utils/animations';
import { EnhancedButton } from '../../components';
import { theme } from '../../utils/theme';
import OnboardingScreen from './OnboardingScreen';

interface OnboardingCarouselProps {
  onComplete: () => void;
  onSkip: () => void;
}

const onboardingData = [
  {
    title: 'Welcome to MoonGaze',
    description:
      'Transform your shared responsibilities into a fun and collaborative experience with your partner.',
    illustration: '🌙',
  },
  {
    title: 'Link with Your Partner',
    description:
      'Connect with your partner using a simple code to start sharing tasks and celebrating achievements together.',
    illustration: '💕',
  },
  {
    title: 'Create & Share Tasks',
    description:
      'Add tasks, assign them to yourself or your partner, and track progress in real-time.',
    illustration: '✅',
  },
  {
    title: 'Earn Points Together',
    description:
      'Complete tasks to earn points and build your shared team score. Make responsibilities rewarding!',
    illustration: '🏆',
  },
];

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  controlsContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
    paddingBottom: theme.spacing.xl + theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  indicator: {
    borderRadius: 6,
    elevation: theme.shadows.sm.elevation,
    height: 12,
    marginHorizontal: 6,
    shadowColor: theme.shadows.sm.shadowColor,
    shadowOffset: theme.shadows.sm.shadowOffset,
    shadowOpacity: theme.shadows.sm.shadowOpacity,
    shadowRadius: theme.shadows.sm.shadowRadius,
    width: 12,
  },
  indicatorContainer: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  indicatorTrack: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  nextButton: {
    flex: 2,
  },
  page: {
    flex: 1,
    justifyContent: 'center',
  },
  pager: {
    flex: 1,
  },
  progressText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.medium,
  },
  skipButton: {
    flex: 1,
  },
});

interface IndicatorDotProps {
  currentPage: number;
  index: number;
}

const IndicatorDot: React.FC<IndicatorDotProps> = ({ currentPage, index }) => {
  const indicatorAnimatedStyle = useAnimatedStyle(() => {
    const isActive = currentPage === index;
    const isPrevious = index < currentPage;
    
    const opacity = isPrevious ? 1 : isActive ? 1 : 0.3;
    const scale = isActive ? 1.2 : 1;
    const backgroundColor = isPrevious || isActive 
      ? theme.colors.primary 
      : theme.colorPalette.neutral[300];
    
    return {
      backgroundColor: withTiming(backgroundColor, { duration: DURATIONS.fast }),
      opacity: withTiming(opacity, { duration: DURATIONS.fast }),
      transform: [{ scale: withTiming(scale, { duration: DURATIONS.fast }) }],
    };
  });

  return (
    <Animated.View
      style={[styles.indicator, indicatorAnimatedStyle]}
    />
  );
};

const OnboardingCarousel: React.FC<OnboardingCarouselProps> = ({
  onComplete,
  onSkip,
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const pagerRef = useRef<PagerView>(null);
  
  // Enhanced animations
  const containerOpacity = useSharedValue(0);
  const indicatorProgress = useSharedValue(0);
  const controlsTranslateY = useSharedValue(50);
  const controlsOpacity = useSharedValue(0);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const controlsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
    transform: [{ translateY: controlsTranslateY.value }],
  }));

  // Entrance animation on mount
  useEffect(() => {
    containerOpacity.value = withTiming(1, { duration: DURATIONS.normal, easing: EASING });
    controlsOpacity.value = withDelay(200, withTiming(1, { duration: DURATIONS.normal, easing: EASING }));
    controlsTranslateY.value = withDelay(200, withTiming(0, { duration: DURATIONS.normal, easing: EASING }));
  }, [containerOpacity, controlsOpacity, controlsTranslateY]);

  // Update indicator progress when page changes
  useEffect(() => {
    indicatorProgress.value = withTiming(currentPage, { duration: DURATIONS.normal, easing: EASING });
  }, [currentPage, indicatorProgress]);

  const handleNext = () => {
    if (currentPage < onboardingData.length - 1) {
      const nextPage = currentPage + 1;
      pagerRef.current?.setPage(nextPage);
      setCurrentPage(nextPage);
    } else {
      // Smooth exit animation
      containerOpacity.value = withTiming(0, { 
        duration: DURATIONS.normal, 
        easing: EASING, 
      }, (finished) => {
        if (finished) {
          runOnJS(onComplete)();
        }
      });
    }
  };

  const handleSkip = () => {
    containerOpacity.value = withTiming(0, { 
      duration: DURATIONS.normal, 
      easing: EASING, 
    }, (finished) => {
      if (finished) {
        runOnJS(onSkip)();
      }
    });
  };

  const handlePageSelected = (event: { nativeEvent: { position: number } }) => {
    setCurrentPage(event.nativeEvent.position);
  };

  const isLastPage = currentPage === onboardingData.length - 1;

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={handlePageSelected}
      >
        {onboardingData.map((screen, index) => (
          <View key={index} style={styles.page}>
            <OnboardingScreen
              title={screen.title}
              description={screen.description}
              illustration={screen.illustration}
              isActive={currentPage === index}
            />
          </View>
        ))}
      </PagerView>

      {/* Enhanced Page Indicators */}
      <View style={styles.indicatorContainer}>
        <View style={styles.indicatorTrack}>
          {onboardingData.map((_, index) => (
            <IndicatorDot
              key={index}
              index={index}
              currentPage={currentPage}
            />
          ))}
        </View>
        
        {/* Progress text */}
        <Text style={styles.progressText}>
          {currentPage + 1} of {onboardingData.length}
        </Text>
      </View>

      {/* Enhanced Navigation Controls */}
      <Animated.View style={[styles.controlsContainer, controlsAnimatedStyle]}>
        <EnhancedButton 
          variant="ghost" 
          size="lg"
          onPress={handleSkip} 
          style={styles.skipButton}
          accessibilityLabel="Skip onboarding"
          accessibilityHint="Skip the onboarding process and go directly to the app"
        >
          Skip
        </EnhancedButton>

        <EnhancedButton 
          variant="primary" 
          size="lg"
          onPress={handleNext} 
          style={styles.nextButton}
          accessibilityLabel={isLastPage ? 'Get started with MoonGaze' : 'Continue to next step'}
          accessibilityHint={isLastPage ? 'Complete onboarding and start using the app' : 'View the next onboarding step'}
        >
          {isLastPage ? 'Get Started' : 'Next'}
        </EnhancedButton>
      </Animated.View>
    </Animated.View>
  );
};

export default OnboardingCarousel;
