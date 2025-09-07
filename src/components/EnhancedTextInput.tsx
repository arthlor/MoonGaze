import React from 'react';
import { StyleSheet, TextStyle, View, ViewStyle } from 'react-native';
import { HelperText, TextInput } from 'react-native-paper';
import { theme } from '../utils/theme';

export type InputSize = 'sm' | 'md' | 'lg';

interface EnhancedTextInputProps {
  accessibilityHint?: string;
  accessibilityLabel?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  disabled?: boolean;
  error?: boolean;
  errorText?: string;
  helperText?: string;
  inputStyle?: TextStyle;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  label?: string;
  leftIcon?: string;
  maxLength?: number;
  multiline?: boolean;
  numberOfLines?: number;
  onBlur?: () => void;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  onIconPress?: () => void;
  onSubmitEditing?: () => void;
  placeholder?: string;
  required?: boolean;
  returnKeyType?: string;
  rightIcon?: string;
  secureTextEntry?: boolean;
  size?: InputSize;
  style?: ViewStyle;
  testID?: string;
  value: string;
}

const EnhancedTextInput: React.FC<EnhancedTextInputProps> = ({
  accessibilityHint,
  accessibilityLabel,
  autoCapitalize = 'sentences',
  disabled = false,
  error = false,
  errorText,
  helperText,
  inputStyle,
  keyboardType = 'default',
  label,
  leftIcon,
  maxLength,
  multiline = false,
  numberOfLines = 1,
  onBlur,
  onChangeText,
  onFocus,
  onIconPress,
  onSubmitEditing,
  placeholder,
  required = false,
  returnKeyType,
  rightIcon,
  secureTextEntry = false,
  size = 'md',
  style,
  testID,
  value,
}) => {
  const handleFocus = () => {
    onFocus?.();
  };

  const handleBlur = () => {
    onBlur?.();
  };

  const getInputStyles = (): ViewStyle => {
    const sizeStyles = getSizeStyles(size);
    return sizeStyles;
  };

  const hasError = Boolean(errorText) || error;

  // Create comprehensive accessibility label
  const getAccessibilityLabel = (): string => {
    let accessLabel =
      accessibilityLabel || label || placeholder || 'Text input';
    if (required) accessLabel += ', required';
    if (errorText) accessLabel += `, error: ${errorText}`;
    return accessLabel;
  };

  const getAccessibilityHint = (): string => {
    if (accessibilityHint) return accessibilityHint;
    if (multiline) return 'Multi-line text input';
    if (secureTextEntry) return 'Secure text entry';
    return 'Text input field';
  };

  return (
    <View style={[styles.container, style]}>
      <TextInput
        mode="outlined"
        label={label}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSubmitEditing={onSubmitEditing}
        multiline={multiline}
        numberOfLines={numberOfLines}
        maxLength={maxLength}
        disabled={disabled}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        returnKeyType={returnKeyType as 'done' | 'go' | 'next' | 'search' | 'send' | undefined}
        style={[getInputStyles(), inputStyle]}
        contentStyle={styles.inputContent}
        outlineColor={hasError ? theme.colors.error : theme.colors.outline}
        activeOutlineColor={
          hasError ? theme.colors.error : theme.colors.primary
        }
        left={leftIcon ? <TextInput.Icon icon={leftIcon} /> : undefined}
        right={
          rightIcon ? (
            <TextInput.Icon icon={rightIcon} onPress={onIconPress} />
          ) : undefined
        }
        accessibilityLabel={getAccessibilityLabel()}
        accessibilityHint={getAccessibilityHint()}
        accessibilityState={{
          disabled,
          busy: false,
        }}
        testID={testID}
        error={hasError}
      />

      {(helperText || errorText) && (
        <HelperText
          type={hasError ? 'error' : 'info'}
          visible={true}
          style={[
            styles.helperText,
            {
              color: hasError
                ? theme.colors.error
                : theme.colors.onSurfaceVariant,
            },
          ]}
        >
          {errorText || helperText}
        </HelperText>
      )}
    </View>
  );
};

const getSizeStyles = (size: InputSize): ViewStyle => {
  switch (size) {
    case 'sm':
      return {
        height: 44, // Ensure minimum 44pt touch target
      };
    case 'lg':
      return {
        height: 56,
      };
    default: // md
      return {
        height: 48,
      };
  }
};

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.xs,
  },
  helperText: {
    fontSize: theme.typography.sizes.sm,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  inputContent: {
    fontFamily: theme.typography.fontFamilies.primary,
    fontSize: theme.typography.sizes.base,
  },
});

export default EnhancedTextInput;
