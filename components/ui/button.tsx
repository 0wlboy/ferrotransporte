import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  type TouchableOpacityProps,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';

/**
 * Props for the custom Button component.
 * Extends standard TouchableOpacityProps for native compatibility.
 */
export interface ButtonProps extends TouchableOpacityProps {
  /** Text content to be displayed inside the button */
  title: string;
  /** Custom style overrides for the button container view */
  containerStyle?: StyleProp<ViewStyle>;
  /** Custom style overrides for the button text */
  textStyle?: StyleProp<TextStyle>;
  /** Renders a loading spinner instead of the text when active */
  isLoading?: boolean;
}

/**
 * A highly reusable, modern and premium button component matching the brand style guide.
 *
 * Features:
 * - Built-in feedback/opacity on press.
 * - Crimson brand aesthetic by default.
 * - Support for loading states.
 * - Seamless support for standard touch handlers.
 */
export function Button({
  title,
  containerStyle,
  textStyle,
  isLoading = false,
  disabled,
  activeOpacity = 0.8,
  ...rest
}: ButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        disabled && styles.disabledButton,
        containerStyle,
      ]}
      activeOpacity={activeOpacity}
      disabled={disabled || isLoading}
      accessibilityRole="button"
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Text style={[styles.text, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#A10F2D', // Deep crimson brand color
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#A10F2D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3, // Android shadow
    width: '100%',
  },
  disabledButton: {
    backgroundColor: '#D1A3AC', // Muted pinkish red for disabled state
    shadowOpacity: 0,
    elevation: 0,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
