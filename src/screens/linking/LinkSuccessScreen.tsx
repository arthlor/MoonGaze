import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import {
  Text,
} from 'react-native-paper';
import Animated, { 
  BounceIn, 
  FadeInDown, 
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import type { PartnerLinkingStackParamList, RootStackParamList } from '../../types';
import { theme } from '../../utils/theme';
import EnhancedButton from '../../components/EnhancedButton';
import EnhancedCard from '../../components/EnhancedCard';

type LinkSuccessScreenRouteProp = RouteProp<PartnerLinkingStackParamList, 'LinkSuccessScreen'>;
type LinkSuccessScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export const LinkSuccessScreen: React.FC = () => {
  const navigation = useNavigation<LinkSuccessScreenNavigationProp>();
  const route = useRoute<LinkSuccessScreenRouteProp>();
  const partnerName = route.params?.partnerName || 'your partner';

  const handleContinue = () => {
    // Navigate to Main app - this will trigger the RootNavigator to show MainNavigator
    // since the user now has a partner
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  // Simplified celebration animation
  const celebrationScale = useSharedValue(0);

  const celebrationStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celebrationScale.value }],
  }));

  useEffect(() => {
    // Simple scale animation
    celebrationScale.value = withTiming(1, { duration: 200 });
  }, [celebrationScale]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View 
          style={[styles.iconContainer, celebrationStyle]}
          entering={BounceIn.duration(400).delay(100)}
        >
          <Text style={styles.successIcon}>🎉</Text>
        </Animated.View>

        <Animated.View 
          style={styles.textContainer}
          entering={FadeInUp.duration(200).delay(150)}
        >
          <Text variant="headlineMedium" style={styles.title}>
            Successfully Linked!
          </Text>
          
          <Text variant="bodyLarge" style={styles.subtitle}>
            You&rsquo;re now connected with {partnerName}. Time to start sharing tasks and celebrating together!
          </Text>
        </Animated.View>

        <Animated.View 
          style={styles.cardContainer}
          entering={FadeInDown.duration(200).delay(200)}
        >
          <EnhancedCard 
            variant="flat" 
            padding="lg" 
            style={styles.featuresCard}
          >
            <Text variant="titleMedium" style={styles.featuresTitle}>
              What&rsquo;s next?
            </Text>
            
            <Animated.View 
              style={styles.featureItem}
              entering={FadeInDown.duration(200).delay(250)}
            >
              <Text style={styles.featureIcon}>✅</Text>
              <Text variant="bodyMedium" style={styles.featureText}>
                Create and assign tasks to each other
              </Text>
            </Animated.View>
            
            <Animated.View 
              style={styles.featureItem}
              entering={FadeInDown.duration(200).delay(300)}
            >
              <Text style={styles.featureIcon}>🏆</Text>
              <Text variant="bodyMedium" style={styles.featureText}>
                Earn points together as a team
              </Text>
            </Animated.View>
            
            <Animated.View 
              style={styles.featureItem}
              entering={FadeInDown.duration(200).delay(350)}
            >
              <Text style={styles.featureIcon}>🔔</Text>
              <Text variant="bodyMedium" style={styles.featureText}>
                Get notified when tasks are completed
              </Text>
            </Animated.View>
            
            <Animated.View 
              style={styles.featureItem}
              entering={FadeInDown.duration(200).delay(400)}
            >
              <Text style={styles.featureIcon}>🎊</Text>
              <Text variant="bodyMedium" style={styles.featureText}>
                Celebrate achievements together
              </Text>
            </Animated.View>
          </EnhancedCard>
        </Animated.View>

        <Animated.View 
          style={styles.actionContainer}
          entering={FadeInUp.duration(200).delay(450)}
        >
          <EnhancedButton
            variant="primary"
            size="lg"
            onPress={handleContinue}
            style={styles.continueButton}
            fullWidth={true}
          >
            Start Managing Tasks
          </EnhancedButton>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  actionContainer: {
    paddingHorizontal: theme.spacing.lg,
  },
  cardContainer: {
    marginBottom: theme.spacing.xl,
  },
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  continueButton: {
    // Enhanced button styling handled by EnhancedButton component
  },
  featureIcon: {
    fontSize: theme.typography.sizes.lg,
    marginRight: theme.spacing.md,
    textAlign: 'center',
    width: 24,
  },
  featureItem: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  featureText: {
    color: theme.colors.onSurfaceVariant,
    flex: 1,
    fontSize: theme.typography.sizes.base,
    lineHeight: theme.typography.lineHeights.normal * theme.typography.sizes.base,
  },
  featuresCard: {
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  featuresTitle: {
    color: theme.colors.onSurface,
    fontSize: theme.typography.sizes.lg,
    fontWeight: '600' as const,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  subtitle: {
    color: theme.colors.onSurfaceVariant,
    fontSize: theme.typography.sizes.lg,
    lineHeight: theme.typography.lineHeights.normal * theme.typography.sizes.lg,
    paddingHorizontal: theme.spacing.lg,
    textAlign: 'center',
  },
  successIcon: {
    fontSize: 80,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    color: theme.colors.onBackground,
    fontSize: theme.typography.sizes.xl,
    fontWeight: '600' as const,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
});