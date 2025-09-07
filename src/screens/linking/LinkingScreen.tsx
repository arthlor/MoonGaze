import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  Divider,
  Text,
} from 'react-native-paper';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import type { PartnerLinkingStackParamList } from '../../types';
import { theme } from '../../utils/theme';
import { CodeGenerator } from './CodeGenerator';
import { CodeInput } from './CodeInput';
import EnhancedButton from '../../components/EnhancedButton';
import EnhancedCard from '../../components/EnhancedCard';

type LinkingScreenNavigationProp = StackNavigationProp<PartnerLinkingStackParamList, 'LinkingScreen'>;

type LinkingMode = 'selection' | 'generate' | 'input';

export const LinkingScreen: React.FC = () => {
  const navigation = useNavigation<LinkingScreenNavigationProp>();
  const [mode, setMode] = useState<LinkingMode>('selection');

  const handleGenerateCode = () => {
    setMode('generate');
  };

  const handleEnterCode = () => {
    setMode('input');
  };

  const handleBackToSelection = () => {
    setMode('selection');
  };

  const handleLinkingSuccess = (partnerName?: string) => {
    navigation.navigate('LinkSuccessScreen', { partnerName });
  };

  const renderSelectionMode = () => (
    <Animated.View 
      style={styles.selectionContainer}
      entering={FadeInDown.duration(200)}
      exiting={FadeOutUp.duration(200)}
    >
      <Animated.View entering={FadeInDown.duration(200)}>
        <Text variant="headlineMedium" style={styles.title}>
          Link with Your Partner
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Connect with your partner to start sharing tasks and celebrating together!
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(200).delay(100)}>
        <EnhancedCard 
          variant="flat" 
          padding="lg" 
          interactive={true}
          onPress={handleGenerateCode}
          style={styles.optionCard}
          accessibilityLabel="Generate a code for your partner"
          accessibilityHint="Creates a unique code that your partner can enter to link with you"
        >
          <View style={styles.cardContent}>
            <Text variant="titleMedium" style={styles.optionTitle}>
              Generate a Code
            </Text>
            <Text variant="bodyMedium" style={styles.optionDescription}>
              Create a unique code for your partner to enter
            </Text>
            <EnhancedButton
              variant="primary"
              size="md"
              onPress={handleGenerateCode}
              style={styles.optionButton}
            >
              Generate Code
            </EnhancedButton>
          </View>
        </EnhancedCard>
      </Animated.View>

      <Animated.View 
        style={styles.dividerContainer}
        entering={FadeInDown.duration(200).delay(150)}
      >
        <Divider style={styles.divider} />
        <Text variant="bodySmall" style={styles.dividerText}>OR</Text>
        <Divider style={styles.divider} />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(200).delay(200)}>
        <EnhancedCard 
          variant="flat" 
          padding="lg" 
          interactive={true}
          onPress={handleEnterCode}
          style={styles.optionCard}
          accessibilityLabel="Enter a code from your partner"
          accessibilityHint="Enter the code your partner shared with you to link together"
        >
          <View style={styles.cardContent}>
            <Text variant="titleMedium" style={styles.optionTitle}>
              I Have a Code
            </Text>
            <Text variant="bodyMedium" style={styles.optionDescription}>
              Enter the code your partner shared with you
            </Text>
            <EnhancedButton
              variant="secondary"
              size="md"
              onPress={handleEnterCode}
              style={styles.optionButton}
            >
              Enter Code
            </EnhancedButton>
          </View>
        </EnhancedCard>
      </Animated.View>
    </Animated.View>
  );

  const renderContent = () => {
    switch (mode) {
      case 'generate':
        return (
          <Animated.View 
            entering={FadeInDown.duration(200)}
            exiting={FadeOutUp.duration(200)}
          >
            <CodeGenerator
              onBack={handleBackToSelection}
              onSuccess={handleLinkingSuccess}
            />
          </Animated.View>
        );
      case 'input':
        return (
          <Animated.View 
            entering={FadeInDown.duration(200)}
            exiting={FadeOutUp.duration(200)}
          >
            <CodeInput
              onBack={handleBackToSelection}
              onSuccess={handleLinkingSuccess}
            />
          </Animated.View>
        );
      default:
        return renderSelectionMode();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {renderContent()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  cardContent: {
    alignItems: 'center',
  },
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  divider: {
    flex: 1,
  },
  dividerContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: theme.spacing.lg,
  },
  dividerText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: theme.typography.sizes.sm,
    fontWeight: '500' as const,
    marginHorizontal: theme.spacing.md,
  },
  optionButton: {
    minWidth: 150,
  },
  optionCard: {
    borderColor: theme.colors.border,
    borderWidth: 1,
    marginBottom: theme.spacing.md,
  },
  optionDescription: {
    color: theme.colors.onSurfaceVariant,
    fontSize: theme.typography.sizes.base,
    lineHeight: theme.typography.lineHeights.normal * theme.typography.sizes.base,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  optionTitle: {
    color: theme.colors.onSurface,
    fontSize: theme.typography.sizes.lg,
    fontWeight: '600' as const,
    marginBottom: theme.spacing.sm,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: theme.spacing.lg,
  },
  selectionContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  subtitle: {
    color: theme.colors.onSurfaceVariant,
    fontSize: theme.typography.sizes.lg,
    lineHeight: theme.typography.lineHeights.normal * theme.typography.sizes.lg,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  title: {
    color: theme.colors.onBackground,
    fontSize: theme.typography.sizes.xl,
    fontWeight: '600' as const,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
});