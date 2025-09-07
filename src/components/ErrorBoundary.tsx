import React, { Component, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from 'react-native-paper';
import { theme } from '../utils/theme';
import { ErrorDisplay } from './ErrorDisplay';
import { ErrorInfo } from '../utils/errorHandling';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  variant?: 'card' | 'modal';
  showDebugInfo?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Create enhanced error info for ErrorDisplay
      const errorInfo: ErrorInfo = {
        message: this.state.error?.message || 'Unknown error occurred',
        code: 'react-error-boundary',
        isRetryable: true,
        userMessage: 'We encountered an unexpected error. Don\'t worry, your data is safe.',
      };

      // Enhanced error UI using ErrorDisplay
      return (
        <View style={styles.container}>
          <ErrorDisplay
            error={errorInfo}
            title="Oops! Something went wrong"
            onRetry={this.handleRetry}
            variant={this.props.variant || 'card'}
            showRetry={true}
          />
          
          {(__DEV__ || this.props.showDebugInfo) && this.state.error && (
            <Card style={styles.debugCard}>
              <Card.Content>
                <Text style={styles.debugTitle}>Debug Information:</Text>
                <Text style={styles.debugText}>
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo?.componentStack && (
                  <Text style={styles.debugText}>
                    Component Stack: {this.state.errorInfo.componentStack.slice(0, 500)}...
                  </Text>
                )}
              </Card.Content>
            </Card>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  debugCard: {
    backgroundColor: theme.colorPalette.neutral[50],
    marginTop: theme.spacing.md,
    maxWidth: 400,
    width: '100%',
  },
  debugText: {
    color: theme.colors.onSurfaceVariant,
    fontFamily: theme.typography.fontFamilies.monospace,
    fontSize: theme.typography.fontSizes.xs,
    lineHeight: theme.typography.lineHeights.tight * theme.typography.fontSizes.xs,
    marginBottom: theme.spacing.xs,
  },
  debugTitle: {
    color: theme.colors.onSurface,
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: '600' as const,
    marginBottom: theme.spacing.sm,
  },
});