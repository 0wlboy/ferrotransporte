import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Props for the custom Input component.
 * Extends standard TextInputProps.
 */
export interface InputProps extends TextInputProps {
  /** Label text displayed above the input field */
  label: string;
  /** Error message to be displayed. If truthy, the input switches to error state */
  error?: string;
  /** Custom container style overrides */
  containerStyle?: StyleProp<ViewStyle>;
  /** Custom style overrides for the input field itself */
  inputStyle?: StyleProp<TextStyle>;
  /** Custom style overrides for the label text */
  labelStyle?: StyleProp<TextStyle>;
}

/**
 * A highly premium and customizable text input component.
 *
 * Features:
 * - Dynamic styling for Focus, Blur, and Error states.
 * - Slashed eye icon toggler for password/secure entries.
 * - Informative animated error labels below the field.
 * - Border transitions from soft pinkish-red to deep brand red, or intense red under errors.
 */
export function Input({
  label,
  error,
  secureTextEntry,
  containerStyle,
  inputStyle,
  labelStyle,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const hasError = !!error;
  const isSecure = secureTextEntry && !isPasswordVisible;

  // Determine active colors based on state hierarchy: Error > Focused > Inactive
  const getLabelColor = () => {
    if (hasError) return '#D32F2F'; // Intense Red
    if (isFocused) return '#A10F2D'; // Deep Brand Crimson
    return '#4A4A4A'; // Slate Grey
  };

  const getBorderColor = () => {
    if (hasError) return '#D32F2F'; // Intense Red
    if (isFocused) return '#A10F2D'; // Deep Brand Crimson
    return '#F5D6DB'; // Light soft pinkish-red
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      <Text style={[styles.label, { color: getLabelColor() }, labelStyle]}>
        {label}
      </Text>

      {/* Input container wrapper */}
      <View
        style={[
          styles.inputContainer,
          { borderColor: getBorderColor(), borderWidth: isFocused || hasError ? 1.5 : 1 },
        ]}
      >
        <TextInput
          style={[styles.input, inputStyle]}
          placeholderTextColor="#A9A9A9"
          secureTextEntry={isSecure}
          onFocus={(e) => {
            setIsFocused(true);
            if (onFocus) onFocus(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            if (onBlur) onBlur(e);
          }}
          autoCapitalize="none"
          {...rest}
        />

        {/* Password Eye Toggle Icon */}
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            activeOpacity={0.7}
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
            accessibilityRole="imagebutton"
          >
            <MaterialCommunityIcons
              name={isPasswordVisible ? 'eye' : 'eye-off'}
              size={22}
              color={hasError ? '#D32F2F' : '#A10F2D'}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Error Message */}
      {hasError && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    height: 52,
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#2E2E2E',
    fontSize: 15,
  },
  iconContainer: {
    paddingLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    paddingLeft: 2,
  },
});
