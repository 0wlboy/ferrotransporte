import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ProfilePicker,
  type PickedImage,
} from "@/components/ui/profile-picker";
import { useAuth } from "@/context/auth-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
import SuccessModal from "@/components/modals/success-modal";
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
import { SafeAreaView } from "react-native-safe-area-context";

// ─────────────────────────────────────────────────────────────────────────────
// REGEX DE VALIDACIÓN  (solo se aplican si el campo fue modificado)
// ─────────────────────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':",.<>\/?\\|]).{6,}$/;
const NOMBRE_REGEX = /^[A-Za-záéíóúÁÉÍÓÚñÑüÜ\s-]{2,60}$/;
const TELEFONO_REGEX = /^\+58\s?[0-9]{10}$/;
const CI_REGEX = /^V-[0-9]{6,8}$/;

// ─────────────────────────────────────────────────────────────────────────────
// OPCIONES DE GERENCIA
// ─────────────────────────────────────────────────────────────────────────────

const GERENCIAS = [
  "Gerencias",
  "Operaciones",
  "Mantenimiento",
  "Recursos Humanos",
  "Logística",
  "Administración",
  "Seguridad",
  "Tecnología",
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * EditProfile — Pantalla para editar el perfil del usuario autenticado.
 *
 * Comportamiento clave:
 * - Los campos se pre-rellenan con los datos actuales del usuario.
 * - El botón "Guardar Cambios" se bloquea mientras ningún campo haya sido modificado.
 * - Solo se envían a la BD los campos que realmente cambiaron (diff).
 * - Ningún campo es obligatorio; solo se valida lo que el usuario tocó.
 * - La imagen se sube a Storage solo si se seleccionó una nueva.
 */
export default function EditProfile() {
  const { user, updateProfile, isLoading } = useAuth();

  // ── Valores originales (referencia para el diff) ──
  const original = useMemo(
    () => ({
      primer_nombre: user?.primer_nombre ?? "",
      apellido: user?.apellido ?? "",
      telf: user?.telf ?? "",
      ci_user: user?.ci_user ?? "",
      gerencia: user?.gerencia ?? "Gerencias",
      email: user?.email ?? "",
    }),
    // Solo calcular una vez al montar; user ya debería estar cargado
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ── Estado del formulario (pre-rellenado con datos actuales) ──
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [profileImage, setProfileImage] = useState<PickedImage | null>(null);
  const [nombre, setNombre] = useState(original.primer_nombre);
  const [apellido, setApellido] = useState(original.apellido);
  const [telefono, setTelefono] = useState(original.telf);
  const [ci, setCi] = useState(original.ci_user);
  const [gerencia, setGerencia] = useState(original.gerencia);
  const [email, setEmail] = useState(original.email);
  const [password, setPassword] = useState("");

  // ── Errores de validación por campo ──
  const [nombreError, setNombreError] = useState("");
  const [apellidoError, setApellidoError] = useState("");
  const [telefonoError, setTelefonoError] = useState("");
  const [ciError, setCiError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");

  // ── UI ──
  const [showDropdown, setShowDropdown] = useState(false);

  // ───────────────────────────────────────────────────────────────────────
  // DETECCIÓN DE CAMBIOS — determina si el botón debe estar habilitado
  // ───────────────────────────────────────────────────────────────────────

  /**
   * `hasChanges` es true si al menos un campo difiere del valor original
   * o si se seleccionó una nueva imagen o se escribió una nueva contraseña.
   */
  const hasChanges = useMemo(() => {
    return (
      profileImage !== null ||
      nombre.trim() !== original.primer_nombre.trim() ||
      apellido.trim() !== original.apellido.trim() ||
      telefono.trim() !== original.telf.trim() ||
      ci.trim() !== original.ci_user.trim() ||
      gerencia !== original.gerencia ||
      email.trim() !== original.email.trim() ||
      password.length > 0
    );
  }, [
    profileImage,
    nombre,
    apellido,
    telefono,
    ci,
    gerencia,
    email,
    password,
    original,
  ]);

  // ───────────────────────────────────────────────────────────────────────
  // VALIDACIÓN — solo valida campos que cambiaron
  // ───────────────────────────────────────────────────────────────────────

  const validateChangedFields = (): boolean => {
    let isValid = true;

    // Nombre — solo validar si fue modificado
    if (nombre.trim() !== original.primer_nombre.trim()) {
      if (!NOMBRE_REGEX.test(nombre.trim())) {
        setNombreError("Solo letras y espacios (2-60 caracteres).");
        isValid = false;
      } else {
        setNombreError("");
      }
    } else {
      setNombreError("");
    }

    // Apellido — solo validar si fue modificado
    if (apellido.trim() !== original.apellido.trim()) {
      if (!NOMBRE_REGEX.test(apellido.trim())) {
        setApellidoError("Solo letras y espacios (2-60 caracteres).");
        isValid = false;
      } else {
        setApellidoError("");
      }
    } else {
      setApellidoError("");
    }

    // Teléfono — solo validar si fue modificado
    if (telefono.trim() !== original.telf.trim()) {
      if (!TELEFONO_REGEX.test(telefono.trim())) {
        setTelefonoError("Formato requerido: +58 XXXXXXXXXX");
        isValid = false;
      } else {
        setTelefonoError("");
      }
    } else {
      setTelefonoError("");
    }

    // CI — solo validar si fue modificado
    if (ci.trim() !== original.ci_user.trim()) {
      if (!CI_REGEX.test(ci.trim())) {
        setCiError("Formato requerido: V-XXXXXXXX");
        isValid = false;
      } else {
        setCiError("");
      }
    } else {
      setCiError("");
    }

    // Email — solo validar si fue modificado
    if (email.trim() !== original.email.trim()) {
      if (!EMAIL_REGEX.test(email.trim())) {
        setEmailError("Ingresa un correo electrónico válido.");
        isValid = false;
      } else {
        setEmailError("");
      }
    } else {
      setEmailError("");
    }

    // Contraseña — solo validar si el usuario escribió algo
    if (password.length > 0) {
      if (!PASSWORD_REGEX.test(password)) {
        setPasswordError(
          "Mín. 6 caracteres con mayúscula, minúscula, número y símbolo.",
        );
        isValid = false;
      } else {
        setPasswordError("");
      }
    } else {
      setPasswordError("");
    }

    return isValid;
  };

  // ───────────────────────────────────────────────────────────────────────
  // ENVÍO DEL FORMULARIO
  // ───────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setGeneralError("");

    if (!validateChangedFields()) return;

    // Construir payload solo con campos modificados
    const payload: Record<string, unknown> = { profileImage };

    if (nombre.trim() !== original.primer_nombre.trim())
      payload.primer_nombre = nombre.trim();
    if (apellido.trim() !== original.apellido.trim())
      payload.apellido = apellido.trim();
    if (telefono.trim() !== original.telf.trim())
      payload.telf = telefono.trim();
    if (ci.trim() !== original.ci_user.trim()) payload.ci_user = ci.trim();
    if (gerencia !== original.gerencia) payload.gerencia = gerencia;
    if (email.trim() !== original.email.trim()) payload.email = email.trim();
    if (password.length > 0) payload.password = password;

    const result = await updateProfile(payload);

    if (result?.error) {
      setGeneralError(result.error);
    } else {
      setShowSuccessModal(true);
    }
  };

  // ───────────────────────────────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      <StatusBar style="light" backgroundColor="#A10F2D" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Encabezado carmesí ── */}
          <View style={styles.headerContainer}>
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
            <Text style={styles.headerTitle}>Editar Perfil</Text>
            <Text style={styles.headerSubtitle}>
              Modifica solo los campos que deseas actualizar
            </Text>
          </View>

          {/* ── Tarjeta del formulario ── */}
          <View style={styles.formCard}>
            {/* ── Selector de foto de perfil ── */}
            <ProfilePicker
              onImageSelected={(img) => setProfileImage(img)}
              initialUri={user?.foto_url ?? undefined}
            />

            {/* ── Fila: Nombre | Apellido ── */}
            <View style={styles.row}>
              <View style={styles.halfField}>
                <Input
                  label="Nombre"
                  placeholder={original.primer_nombre || "Nombre"}
                  value={nombre}
                  onChangeText={(t) => {
                    setNombre(t);
                    if (nombreError) setNombreError("");
                  }}
                  error={nombreError}
                  autoCapitalize="words"
                  autoComplete="given-name"
                />
              </View>
              <View style={styles.halfFieldRight}>
                <Input
                  label="Apellido"
                  placeholder={original.apellido || "Apellido"}
                  value={apellido}
                  onChangeText={(t) => {
                    setApellido(t);
                    if (apellidoError) setApellidoError("");
                  }}
                  error={apellidoError}
                  autoCapitalize="words"
                  autoComplete="family-name"
                />
              </View>
            </View>

            {/* ── Fila: Teléfono | CI ── */}
            <View style={styles.row}>
              <View style={styles.halfField}>
                <Input
                  label="Teléfono"
                  placeholder={original.telf || "+58 XXXXXXXXXX"}
                  value={telefono}
                  onChangeText={(t) => {
                    setTelefono(t);
                    if (telefonoError) setTelefonoError("");
                  }}
                  error={telefonoError}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                />
              </View>
              <View style={styles.halfFieldRight}>
                <Input
                  label="CI"
                  placeholder={original.ci_user || "V-XXXXXXXX"}
                  value={ci}
                  onChangeText={(t) => {
                    setCi(t);
                    if (ciError) setCiError("");
                  }}
                  error={ciError}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {/* ── Gerencia (dropdown) ── */}
            <View style={styles.dropdownWrapper}>
              <Text style={styles.dropdownLabel}>Gerencia</Text>
              <TouchableOpacity
                style={[
                  styles.dropdownButton,
                  gerencia !== original.gerencia &&
                    styles.dropdownButtonChanged,
                ]}
                onPress={() => setShowDropdown(!showDropdown)}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownSelected}>{gerencia}</Text>
                <MaterialCommunityIcons
                  name={showDropdown ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#A10F2D"
                />
              </TouchableOpacity>

              {showDropdown && (
                <View style={styles.dropdownList}>
                  {GERENCIAS.map((ger) => (
                    <TouchableOpacity
                      key={ger}
                      style={[
                        styles.dropdownItem,
                        ger === gerencia && styles.dropdownItemActive,
                      ]}
                      onPress={() => {
                        setGerencia(ger);
                        setShowDropdown(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          ger === gerencia && styles.dropdownItemTextActive,
                        ]}
                      >
                        {ger}
                      </Text>
                      {ger === gerencia && (
                        <MaterialCommunityIcons
                          name="check"
                          size={16}
                          color="#A10F2D"
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* ── Correo electrónico ── */}
            <Input
              label="Correo electrónico"
              placeholder={original.email || "correo@ejemplo.com"}
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (emailError) setEmailError("");
              }}
              error={emailError}
              keyboardType="email-address"
              autoComplete="email"
              autoCapitalize="none"
            />

            {/* ── Nueva contraseña (opcional) ── */}
            <Input
              label="Nueva contraseña (opcional)"
              placeholder="Dejar vacío para no cambiarla"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (passwordError) setPasswordError("");
              }}
              error={passwordError}
              secureTextEntry
              autoComplete="new-password"
            />

            {/* ── Error general ── */}
            {generalError ? (
              <View style={styles.generalErrorContainer}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={16}
                  color="#A10F2D"
                />
                <Text style={styles.generalErrorText}>{generalError}</Text>
              </View>
            ) : null}

            {/* ── Aviso si no hay cambios ── */}
            {!hasChanges && (
              <View style={styles.noChangesHint}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={15}
                  color="#9A9A9A"
                />
                <Text style={styles.noChangesText}>
                  Modifica al menos un campo para guardar
                </Text>
              </View>
            )}

            {/* ── Botón Guardar ── */}
            <Button
              title="Guardar Cambios"
              onPress={handleSave}
              isLoading={isLoading}
              disabled={!hasChanges || isLoading}
              containerStyle={styles.submitButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <SuccessModal
        visible={showSuccessModal}
        title="¡Perfil actualizado!"
        message="Los cambios se guardaron correctamente."
        onClose={() => {
          setShowSuccessModal(false);
          router.back();
        }}
      />
    </SafeAreaView>
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

  // ── Encabezado ──
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 16 : 32,
    paddingBottom: 30,
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
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
    lineHeight: 40,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    marginTop: 6,
    fontWeight: "400",
  },

  // ── Tarjeta ──
  formCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 48,
  },

  // ── Filas ──
  row: {
    flexDirection: "row",
  },
  halfField: {
    flex: 1,
    marginRight: 6,
  },
  halfFieldRight: {
    flex: 1,
    marginLeft: 6,
  },

  // ── Dropdown de gerencia ──
  dropdownWrapper: {
    marginBottom: 16,
    zIndex: 999,
  },
  dropdownLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A4A4A",
    marginBottom: 6,
  },
  dropdownButton: {
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E8E8EC",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },
  dropdownButtonChanged: {
    borderColor: "#A10F2D",
    backgroundColor: "#FFF8F9",
  },
  dropdownSelected: {
    fontSize: 15,
    color: "#2E2E2E",
  },
  dropdownList: {
    position: "absolute",
    top: 82,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F5D6DB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#FFF0F2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownItemActive: {
    backgroundColor: "#FFF0F2",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#2E2E2E",
  },
  dropdownItemTextActive: {
    color: "#A10F2D",
    fontWeight: "600",
  },

  // ── Feedback ──
  generalErrorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF0F2",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  generalErrorText: {
    fontSize: 13,
    color: "#A10F2D",
    flex: 1,
    flexWrap: "wrap",
  },
  noChangesHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
    justifyContent: "center",
  },
  noChangesText: {
    fontSize: 13,
    color: "#9A9A9A",
  },

  // ── Botón ──
  submitButton: {
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
});
