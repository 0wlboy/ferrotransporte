import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import SuccessModal from "@/components/modals/success-modal";
import { supabase } from "@/utils/supabase";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
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
// VALIDACIONES Y UTILIDADES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Expresión regular para validar la fortaleza de una contraseña.
 * Requiere mínimo 6 caracteres, al menos 1 letra y 1 número.
 */
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;

/**
 * Parsea los parámetros de recuperación de una URL (soportando fragmentos '#' y consulta '?').
 */
const parseRecoveryParams = (url: string) => {
  const params: { [key: string]: string } = {};

  const parsePart = (part: string) => {
    const pairs = part.split("&");
    for (const pair of pairs) {
      const [key, value] = pair.split("=");
      if (key) {
        params[decodeURIComponent(key)] = decodeURIComponent(value || "");
      }
    }
  };

  const hashIndex = url.indexOf("#");
  if (hashIndex !== -1) {
    parsePart(url.slice(hashIndex + 1));
  }

  const queryIndex = url.indexOf("?");
  if (queryIndex !== -1) {
    const endOfQuery = hashIndex !== -1 && hashIndex > queryIndex ? hashIndex : url.length;
    parsePart(url.slice(queryIndex + 1, endOfQuery));
  }

  return params;
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pantalla de cambio de contraseña
 *
 * Responsabilidades:
 * - Validar localmente el formato de email y fortaleza de contraseña con regex.
 * - Mostrar errores dinámicos del servidor bajo los inputs correspondientes.
 */
export default function ChangePassword() {
  const insets = useSafeAreaInsets();
  // ── Estado del formulario ──
  const [password, setPassword] = useState("");
  // ── Estado de errores locales (validación regex) ──
  const [passwordError, setPasswordError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // ── Contexto de autenticación ──
  const { resetPassword, isLoading, isAuthenticated } = useAuth();

  // ── Efecto para establecer la sesión desde el deep link de recuperación ──
  useEffect(() => {
    let isMounted = true;

    const handleSessionAndDeepLink = async () => {
      // 1. Si ya estamos autenticados en el contexto (sesión activa en memoria), no hacemos nada
      if (isAuthenticated) {
        return;
      }

      // 2. Si no, consultamos si ya hay una sesión activa de Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        return;
      }

      const processDeepLinkUrl = async (url: string) => {
        console.log("[changePassword] Procesando URL:", url);
        const params = parseRecoveryParams(url);

        // Flujo 1: Implicit flow (tiene access_token y refresh_token en el hash)
        if (params.access_token && params.refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
          if (!error) {
            console.log("[changePassword] Sesión establecida por token implícito.");
            return true;
          } else {
            console.error("[changePassword] Error al setSession:", error.message);
          }
        }

        // Flujo 2: PKCE flow (tiene code en la query string)
        if (params.code) {
          const { error } = await supabase.auth.exchangeCodeForSession(params.code);
          if (!error) {
            console.log("[changePassword] Sesión establecida por código PKCE.");
            return true;
          } else {
            console.error("[changePassword] Error al exchangeCodeForSession:", error.message);
          }
        }

        return false;
      };

      // 3. Obtenemos la URL inicial (si el link abrió la app)
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          const success = await processDeepLinkUrl(initialUrl);
          if (success) return;
        }
      } catch (err) {
        console.error("Error al obtener la URL inicial:", err);
      }

      // 4. Si no hay sesión inicial, configuramos el listener para URLs subsecuentes
      const subscription = Linking.addEventListener("url", async (event) => {
        if (event.url && isMounted) {
          const success = await processDeepLinkUrl(event.url);
          if (success) return;
        }
      });

      // Si tras verificar no hay sesión activa ni se pudo establecer mediante URL,
      // lanzamos la alerta y redirección tras un breve lapso de inicialización.
      const timeoutId = setTimeout(async () => {
        if (!isMounted) return;
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!currentSession) {
          Alert.alert(
            "Enlace expirado o inválido",
            "El enlace de recuperación ya no es válido o ha expirado. Por favor, solicita un nuevo correo.",
            [{ text: "Entendido", onPress: () => router.replace("/login") }]
          );
        }
      }, 1500);

      return () => {
        subscription.remove();
        clearTimeout(timeoutId);
      };
    };

    let cleanupFn: (() => void) | undefined;
    handleSessionAndDeepLink().then((cleanup) => {
      cleanupFn = cleanup;
    });

    return () => {
      isMounted = false;
      if (cleanupFn) cleanupFn();
    };
  }, [isAuthenticated]);

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

    //validacion de contraseña
    if (!password) {
      setPasswordError("La contraseña es requerida.");
      isValid = false;
    } else if (!PASSWORD_REGEX.test(password)) {
      setPasswordError("Mínimo 6 caracteres con al menos 1 letra y 1 número.");
      isValid = false;
    } else {
      setPasswordError("");
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
  const updatePassword = async () => {
    if (!validateForm()) return;

    const { error } = await resetPassword(password);

    if (error) {
      // Mostrar el error del servidor bajo el campo de password
      setPasswordError(error);
    } else {
      setShowSuccessModal(true);
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
            {/* Campo: Contraseña */}
            <Input
              label="Nueva Contraseña"
              placeholder="****************"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError("");
              }}
              error={passwordError}
              secureTextEntry
              autoComplete="password"
            />

            {/* Botón de inicio de sesión */}
            <Button
              title="Cambiar Contraseña"
              onPress={updatePassword}
              isLoading={isLoading}
              containerStyle={styles.submitButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <SuccessModal
        visible={showSuccessModal}
        title="Contraseña actualizada"
        message="Tu contraseña ha sido restablecida exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña."
        onClose={() => {
          setShowSuccessModal(false);
          router.replace("/login");
        }}
      />
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
