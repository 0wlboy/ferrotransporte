// nuevo comentario

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─────────────────────────────────────────────────────────────────────────────
// VALIDACIONES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Expresión regular para validar el formato de un correo electrónico.
 * Exige al menos: [algo]@[algo].[algo]
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pantalla de recuperacion de contraseña
 *
 * Responsabilidades:
 * - Validar localmente el formato de email y fortaleza de contraseña con regex.
 * - Delegar la autenticación real a `useAuth().signIn`.
 * - Mostrar errores dinámicos del servidor bajo los inputs correspondientes.
 * - Navegar al home tras autenticación exitosa (manejado por el contexto).
 */
export default function ResetPassword() {
  const insets = useSafeAreaInsets();
  // ── Estado del formulario ──
  const [email, setEmail] = useState("");
  // ── Estado de errores locales (validación regex) ──
  const [emailError, setEmailError] = useState("");

  // ── Contexto de autenticación ──
  const { sendResetEmail, isLoading } = useAuth();

  // ───────────────────────────────────────────────────────────────────────
  // VALIDACIÓN LOCAL
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Valida el formulario localmente con las expresiones regulares definidas.
   * Actualiza los estados de error para cada campo de forma independiente.
   *
   * @returns {boolean} `true` si todos los campos son válidos, `false` en caso contrario.
   */
  const validateForm = () => {
    let isValid = true;

    // Validación de email
    if (!email.trim()) {
      setEmailError("El correo electrónico es requerido.");
      isValid = false;
    } else if (!EMAIL_REGEX.test(email.trim())) {
      setEmailError("Ingresa un correo electrónico válido.");
      isValid = false;
    } else {
      setEmailError("");
    }

    return isValid;
  };

  // ───────────────────────────────────────────────────────────────────────
  // MANEJADORES
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Maneja el envío del formulario de reinicio de contraseña.
   * Primero valida localmente y luego delega al contexto de auth.
   * Los errores del servidor se muestran como error en el campo de correo.
   */
  const handleSendEmail = async () => {
    if (!validateForm()) return;

    const { error } = await sendResetEmail(email);

    if (error) {
      // Mostrar el error del servidor bajo el campo de email
      setEmailError(error);
    } else {
      Alert.alert(
        "Correo enviado",
        "Hemos enviado un enlace de recuperación a tu correo electrónico. Por favor, revísalo para restablecer tu contraseña.",
        [{ text: "Entendido", onPress: () => router.replace("/login") }]
      );
    }
  };

  // ───────────────────────────────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.safeContainer, { paddingTop: insets.top }]}>
      <StatusBar style="light" backgroundColor="#A10F2D" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* ── Sección de encabezado (fondo carmesí) ── */}
          <View style={styles.headerContainer}>
            {/* Botón de Atrás */}
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.8}
              style={styles.backButton}
              accessibilityLabel="Volver"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={22}
                color="#A10F2D"
              />
            </TouchableOpacity>

            {/* Título de la pantalla */}
            <Text style={styles.headerTitle}>Reinicio de Contraseña</Text>
          </View>

          {/* ── Tarjeta del formulario (fondo blanco) ── */}
          <View style={styles.formCard}>
            {/* Campo: Correo electrónico */}
            <Input
              label="Introduce tu Correo"
              placeholder="email@email.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError("");
              }}
              error={emailError}
              keyboardType="email-address"
              autoComplete="email"
              autoCapitalize="none"
            />

            {/* Botón de inicio de sesión */}
            <Button
              title="Enviar"
              onPress={handleSendEmail}
              isLoading={isLoading}
              containerStyle={styles.submitButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#A10F2D",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: "#A10F2D",
  },
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 40 : 60,
    paddingBottom: 35,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  formCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 40,
  },
  forgotPasswordContainer: {
    alignSelf: "flex-start",
    marginTop: 6,
    marginBottom: 28,
  },
  submitButton: {
    marginTop: 10,
    marginBottom: 24,
  },
  registerContainer: {
    alignSelf: "center",
    marginTop: 10,
  },
  linkTextNormal: {
    fontSize: 14,
    color: "#2E2E2E",
    fontWeight: "500",
  },
  linkTextRed: {
    color: "#A10F2D",
    fontWeight: "700",
  },
});
