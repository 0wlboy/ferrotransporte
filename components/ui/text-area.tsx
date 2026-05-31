import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
  View,
} from "react-native";

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

export interface TextAreaProps extends TextInputProps {
  /** Etiqueta que se muestra encima del campo. */
  label: string;
  /** Mensaje de error; cuando está presente el borde se torna rojo. */
  error?: string;
  /** Número de líneas visibles (controla la altura del área). @default 5 */
  numberOfLines?: number;
  /** Estilos adicionales para el contenedor externo. */
  containerStyle?: StyleProp<ViewStyle>;
  /** Estilos adicionales para el campo de texto. */
  inputStyle?: StyleProp<TextStyle>;
  /** Estilos adicionales para la etiqueta. */
  labelStyle?: StyleProp<TextStyle>;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `TextArea` — Campo de texto multilínea con estilo consistente con `Input`.
 *
 * Uso:
 * ```tsx
 * <TextArea
 *   label="Descripción de la petición"
 *   placeholder="Mantenimiento preventivo en....."
 *   value={descripcion}
 *   onChangeText={setDescripcion}
 *   numberOfLines={5}
 * />
 * ```
 */
export function TextArea({
  label,
  error,
  numberOfLines = 5,
  containerStyle,
  inputStyle,
  labelStyle,
  onFocus,
  onBlur,
  ...rest
}: TextAreaProps) {
  const [isFocused, setIsFocused] = useState(false);

  const hasError = !!error;

  const getLabelColor = () => {
    if (hasError) return "#D32F2F";
    if (isFocused) return "#A10F2D";
    return "#4A4A4A";
  };

  const getBorderColor = () => {
    if (hasError) return "#D32F2F";
    if (isFocused) return "#A10F2D";
    return "#F5D6DB";
  };

  const minHeight = numberOfLines * 24 + 16; // approx line-height * lines + padding

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Etiqueta */}
      <Text style={[styles.label, { color: getLabelColor() }, labelStyle]}>
        {label}
      </Text>

      {/* Área de texto */}
      <View
        style={[
          styles.inputContainer,
          {
            borderColor: getBorderColor(),
            borderWidth: isFocused || hasError ? 1.5 : 1,
            minHeight,
          },
        ]}
      >
        <TextInput
          style={[styles.input, { minHeight: minHeight - 16 }, inputStyle]}
          placeholderTextColor="#A9A9A9"
          multiline
          textAlignVertical="top"
          onFocus={(e) => {
            setIsFocused(true);
            if (onFocus) onFocus(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            if (onBlur) onBlur(e);
          }}
          {...rest}
        />
      </View>

      {/* Mensaje de error */}
      {hasError && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  inputContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  input: {
    color: "#2E2E2E",
    fontSize: 15,
    lineHeight: 22,
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
    paddingLeft: 2,
  },
});
