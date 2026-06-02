import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ProfilePicker,
  type PickedImage,
} from "@/components/ui/profile-picker";
import { useAuth } from "@/context/auth-context";
import { useUploadImage } from "@/hooks/useUploadImage";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Image,
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
// VALIDACIONES
// ─────────────────────────────────────────────────────────────────────────────

/** Regex para validar correo electrónico. */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Regex para contraseña: mínimo 6 caracteres con al menos 1 letra mayuscula, 1 letra minuscula, 1 simbolo y 1 número. */
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':",.<>\/?\\|]).{6,}$/;

/** Regex para nombre/apellido: letras (con acentos y ñ), espacios y guiones, 2-60 chars. */
const NOMBRE_REGEX = /^[A-Za-záéíóúÁÉÍÓÚñÑüÜ\s-]{2,60}$/;

/** Regex para número de teléfono venezolano (+58 XXXXXXXXX). */
const TELEFONO_REGEX = /^\+58\s?[0-9]{10}$/;

/** Regex para cédula venezolana (V-XXXXXXXX). */
const CI_REGEX = /^V-[0-9]{6,8}$/;

// ─────────────────────────────────────────────────────────────────────────────
// OPCIONES DE DEPARTAMENTO
// ─────────────────────────────────────────────────────────────────────────────

/** Lista de departamentos disponibles para el selector. */
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
 * Pantalla de registro de nuevos usuarios — "Registro de Usuario".
 *
 * Campos del formulario:
 * - Foto de perfil (obligatoria, con previsualización en círculo)
 * - Nombre y Apellido (lado a lado)
 * - Teléfono y CI (lado a lado)
 * - Departamento (selector con dropdown)
 * - Correo electrónico
 * - Contraseña
 *
 * Responsabilidades:
 * - Validar localmente todos los campos con regex específicas.
 * - Delegar registro al contexto de auth (`useAuth().signUp`).
 * - Mostrar errores debajo de cada campo correspondiente.
 * - La imagen de perfil queda procesada y lista para enviarse a un backend futuro.
 */
export default function SingIn() {
  // ── Estado del formulario ──
  const [profileImage, setProfileImage] = useState<PickedImage | null>(null);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("+58 ");
  const [ci, setCi] = useState("V-");
  const [gerencia, setGerencia] = useState("Gerencias");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ── Estado de errores por campo ──
  const [profileError, setProfileError] = useState("");
  const [nombreError, setNombreError] = useState("");
  const [apellidoError, setApellidoError] = useState("");
  const [telefonoError, setTelefonoError] = useState("");
  const [ciError, setCiError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // ── Dropdown de gerencia ──
  const [showDropdown, setShowDropdown] = useState(false);

  // ── Contexto de autenticación ──
  const { signUp, isLoading } = useAuth();

  // ── Subida de imagen de perfil a Supabase Storage ──
  const { uploadImage, uploading, error: uploadError } = useUploadImage();

  // ───────────────────────────────────────────────────────────────────────
  // MANEJADOR: Selección de imagen de perfil
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Recibe la imagen procesada del componente ProfilePicker.
   * La imagen está lista para enviarse a un backend cuando se disponga de destino.
   *
   * @param {PickedImage} image - Metadatos de la imagen seleccionada.
   */
  const handleImageSelected = (image: PickedImage) => {
    setProfileImage(image);
    if (profileError) setProfileError("");
  };

  // ───────────────────────────────────────────────────────────────────────
  // VALIDACIÓN LOCAL
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Valida todos los campos del formulario con regex independientes.
   * Reporta error de forma granular por campo.
   *
   * @returns {boolean} `true` si el formulario es válido.
   */
  const validateForm = (): boolean => {
    let isValid = true;

    // Validación de foto de perfil (campo obligatorio)
    if (!profileImage) {
      setProfileError("La foto de perfil es requerida.");
      isValid = false;
    } else {
      setProfileError("");
    }

    // Validación del nombre
    if (!nombre.trim()) {
      setNombreError("El nombre es requerido.");
      isValid = false;
    } else if (!NOMBRE_REGEX.test(nombre.trim())) {
      setNombreError("Solo letras y espacios (2-60 chars).");
      isValid = false;
    } else {
      setNombreError("");
    }

    // Validación del apellido
    if (!apellido.trim()) {
      setApellidoError("El apellido es requerido.");
      isValid = false;
    } else if (!NOMBRE_REGEX.test(apellido.trim())) {
      setApellidoError("Solo letras y espacios (2-60 chars).");
      isValid = false;
    } else {
      setApellidoError("");
    }

    // Validación del teléfono
    const telefonoLimpio = telefono.trim();
    if (!telefonoLimpio || telefonoLimpio === "+58") {
      setTelefonoError("El teléfono es requerido.");
      isValid = false;
    } else if (!TELEFONO_REGEX.test(telefonoLimpio)) {
      setTelefonoError("Formato: +58 XXXXXXXXXX");
      isValid = false;
    } else {
      setTelefonoError("");
    }

    // Validación de la cédula
    const ciLimpio = ci.trim();
    if (!ciLimpio || ciLimpio === "V-") {
      setCiError("La cédula es requerida.");
      isValid = false;
    } else if (!CI_REGEX.test(ciLimpio)) {
      setCiError("Formato: V-XXXXXXXX");
      isValid = false;
    } else {
      setCiError("");
    }

    // Validación del email
    if (!email.trim()) {
      setEmailError("El correo electrónico es requerido.");
      isValid = false;
    } else if (!EMAIL_REGEX.test(email.trim())) {
      setEmailError("Ingresa un correo válido.");
      isValid = false;
    } else {
      setEmailError("");
    }

    // Validación de la contraseña
    if (!password) {
      setPasswordError("La contraseña es requerida.");
      isValid = false;
    } else if (!PASSWORD_REGEX.test(password)) {
      setPasswordError(
        "Mínimo 6 caracteres con 1 letra minuscula, 1 letra mayuscula, 1 simbolo (¿?¡!/&%$#) y 1 número.",
      );
      isValid = false;
    } else {
      setPasswordError("");
    }

    return isValid;
  };

  // ───────────────────────────────────────────────────────────────────────
  // MANEJADOR: Envío del formulario
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Orquesta el proceso completo de registro:
   * 1. Valida el formulario localmente.
   * 2. Sube la foto de perfil al bucket `avatars` de Supabase Storage.
   * 3. Delega al contexto de auth con la URL pública de la imagen.
   */
  const handleRegister = async () => {
    if (!validateForm()) return;

    // ── 1. Subir imagen de perfil ──
    // profileImage siempre existe aquí porque validateForm() lo garantiza.
    /* const avatarUrl = await uploadImage(profileImage!, {
      bucket: "fotosPerfil",
      uniqueFileName: true,
      upsert: false,
    });

    if (!avatarUrl) {
      // El error real ya es logueado dentro del hook con console.error.
      // No bloqueamos el registro si la subida falla — la foto es opcional
      // y se puede actualizar más adelante desde el perfil.
      console.warn(
        "No se pudo subir la imagen de perfil. Continuando sin foto...",
      );
    }*/

    // ── 2. Registrar usuario en Supabase Auth ──
    const { emailError: serverEmailError, generalError } = await signUp({
      profileImage,
      email,
      password,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      ci: ci.trim(),
      telefono: telefono.trim(),
      gerencia: gerencia,
    });

    if (serverEmailError) setEmailError(serverEmailError);
    if (generalError) setEmailError(generalError);
  };

  // ───────────────────────────────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeContainer}>
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
            {/* Logo de la marca */}
            <View style={styles.logoContainer}>
              <View style={styles.logoSquare}>
                <Image
                  source={require("@/assets/images/ferrominera-logo.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Título multilinea */}
            <Text style={styles.headerTitle}>{"Registro de\nUsuario"}</Text>
          </View>

          {/* ── Tarjeta del formulario ── */}
          <View style={styles.formCard}>
            {/* ── Selector de foto de perfil ── */}
            <ProfilePicker
              onImageSelected={handleImageSelected}
              error={profileError}
            />

            {/* ── Fila: Nombre | Apellido ── */}
            <View style={styles.row}>
              <View style={styles.halfField}>
                <Input
                  label="Nombre"
                  placeholder="Nombre"
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
                  placeholder="Nombre"
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
                  label="Telefono"
                  placeholder="+58 4129807"
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
                  placeholder="V-00000000"
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

            {/* ── gerencia (dropdown) ── */}
            <View style={styles.dropdownWrapper}>
              <Text style={styles.dropdownLabel}>Gerencia</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowDropdown(!showDropdown)}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownSelected}>{gerencia}</Text>
                <Text style={styles.dropdownChevron}>▾</Text>
              </TouchableOpacity>

              {/* Lista desplegable */}
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
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* ── Correo electrónico ── */}
            <Input
              label="Correo"
              placeholder="email@email.com"
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

            {/* ── Contraseña ── */}
            <Input
              label="Contraseña"
              placeholder="Password"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (passwordError) setPasswordError("");
              }}
              error={passwordError}
              secureTextEntry
              autoComplete="new-password"
            />

            {/* ── Botón de registro ── */}
            <Button
              title="Registrar Usuario"
              onPress={handleRegister}
              isLoading={isLoading || uploading}
              containerStyle={styles.submitButton}
            />

            {/* ── Link: ¿Ya estás registrado? ── */}
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.loginLinkContainer}
              activeOpacity={0.6}
            >
              <Text style={styles.linkTextNormal}>
                ¿Estas registrado?{" "}
                <Text style={styles.linkTextRed}>Inicia sesión aqui</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingTop: Platform.OS === "ios" ? 30 : 48,
    paddingBottom: 30,
  },
  logoContainer: {
    marginBottom: 25,
  },
  logoSquare: {
    width: 68,
    height: 68,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  logo: {
    width: 56,
    height: 56,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
    lineHeight: 40,
  },

  // ── Tarjeta ──
  formCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 40,
  },

  // ── Filas de 2 columnas ──
  row: {
    flexDirection: "row",
    marginBottom: 0,
  },
  halfField: {
    flex: 1,
    marginRight: 6,
  },
  halfFieldRight: {
    flex: 1,
    marginLeft: 6,
  },

  // ── Dropdown de departamento ──
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
    borderColor: "#F5D6DB",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },
  dropdownSelected: {
    fontSize: 15,
    color: "#2E2E2E",
  },
  dropdownChevron: {
    fontSize: 16,
    color: "#A10F2D",
  },
  dropdownList: {
    position: "absolute",
    top: 80,
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
    elevation: 8,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#FFF0F2",
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

  // ── Acciones ──
  submitButton: {
    marginTop: 8,
    marginBottom: 20,
  },
  loginLinkContainer: {
    alignSelf: "center",
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
