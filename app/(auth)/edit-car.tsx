import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    ProfilePicker,
    type PickedImage,
} from "@/components/ui/profile-picker";
import { useCars } from "@/context/car-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
import SuccessModal from "@/components/modals/success-modal";
import {
    ActivityIndicator,
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
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * EditCar — Pantalla para editar la información del vehículo del conductor.
 *
 * Comportamiento clave:
 * - Los campos se pre-rellenan con los datos actuales del vehículo desde el CarContext.
 * - El botón "Guardar Cambios" se bloquea mientras ningún campo haya sido modificado.
 * - Solo se envían a la BD los campos que realmente cambiaron (diff).
 * - La imagen se sube a Storage solo si se seleccionó una nueva.
 */
export default function EditCar() {
  const insets = useSafeAreaInsets();
  const { car, updateCar, isLoading, isInitializing } = useCars();

  // ── Valores originales (referencia para el diff) ──
  const original = useMemo(
    () => ({
      modelo: car?.modelo ?? "",
      marca: car?.marca ?? "",
      // num_asientos es number en la BD → convertir a string para los inputs
      numero: car?.num_asientos != null ? String(car.num_asientos) : "",
      año: car?.año != null ? String(car.año) : "",
      estado: car?.estado ?? "",
      // maletero_amplio es boolean en la BD → convertir a string ("Sí" / "No") para el input
      maletero_amplio:
        car?.maletero_amplio != null ? (car.maletero_amplio ? "Sí" : "No") : "",
    }),
    // Solo calcular una vez al montar; car ya debería estar cargado
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ── Estado del formulario (pre-rellenado con datos actuales) ──
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [profileImage, setProfileImage] = useState<PickedImage | null>(null);
  const [modelo, setModelo] = useState(original.modelo);
  const [marca, setMarca] = useState(original.marca);
  const [numero, setNumero] = useState(original.numero);
  const [año, setAño] = useState(original.año);
  const [estado, setEstado] = useState(original.estado);
  const [maletero_amplio, setMaletero_amplio] = useState(
    original.maletero_amplio,
  );

  // ── Errores de validación por campo ──
  const [modeloError, setModeloError] = useState("");
  const [marcaError, setMarcaError] = useState("");
  const [numeroError, setNumeroError] = useState("");
  const [añoError, setAñoError] = useState("");
  const [estadoError, setEstadoError] = useState("");
  const [maletero_amplioError, setMaletero_amplioError] = useState("");
  const [generalError, setGeneralError] = useState("");

  // ───────────────────────────────────────────────────────────────────────
  // DETECCIÓN DE CAMBIOS — determina si el botón debe estar habilitado
  // ───────────────────────────────────────────────────────────────────────

  /**
   * `hasChanges` es true si al menos un campo difiere del valor original
   * o si se seleccionó una nueva imagen.
   */
  const hasChanges = useMemo(() => {
    return (
      profileImage !== null ||
      modelo.trim() !== original.modelo.trim() ||
      marca.trim() !== original.marca.trim() ||
      numero.trim() !== original.numero.trim() ||
      año.trim() !== original.año.trim() ||
      estado.trim() !== original.estado.trim() ||
      maletero_amplio.trim() !== original.maletero_amplio.trim()
    );
  }, [
    profileImage,
    modelo,
    marca,
    numero,
    año,
    estado,
    maletero_amplio,
    original,
  ]);

  // ───────────────────────────────────────────────────────────────────────
  // ENVÍO DEL FORMULARIO
  // ───────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setGeneralError("");
    setMaletero_amplioError("");

    // Validar maletero_amplio
    const maleteroVal = maletero_amplio.trim().toLowerCase();
    if (maleteroVal !== "" && maleteroVal !== "sí" && maleteroVal !== "si" && maleteroVal !== "no") {
      setMaletero_amplioError("Por favor ingresa 'Sí' o 'No'");
      return;
    }

    // Construir payload solo con campos modificados
    const payload: Record<string, unknown> = { profileImage };

    if (modelo.trim() !== original.modelo.trim())
      payload.modelo = modelo.trim();
    if (marca.trim() !== original.marca.trim()) payload.marca = marca.trim();
    // num_asientos es number en la BD → convertir de string a number
    if (numero.trim() !== original.numero.trim())
      payload.num_asientos =
        numero.trim() !== "" ? Number(numero.trim()) : null;
    // año es number en la BD → convertir de string a number
    if (año.trim() !== original.año.trim())
      payload.año = año.trim() !== "" ? Number(año.trim()) : null;
    if (estado.trim() !== original.estado.trim())
      payload.estado = estado.trim();
    // maletero_amplio es boolean en la BD → convertir de string a boolean
    if (maletero_amplio.trim() !== original.maletero_amplio.trim()) {
      payload.maletero_amplio =
        maleteroVal === "" ? null : (maleteroVal === "sí" || maleteroVal === "si");
    }

    const result = await updateCar(payload);

    if (result?.error) {
      setGeneralError(result.error);
    } else {
      setShowSuccessModal(true);
    }
  };

  // ───────────────────────────────────────────────────────────────────────
  // PANTALLA DE CARGA INICIAL
  // ───────────────────────────────────────────────────────────────────────

  if (isInitializing) {
    return (
      <View
        style={[styles.safeContainer, { paddingTop: insets.top }]}
      >
        <StatusBar style="light" backgroundColor="#A10F2D" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>
            Cargando información del vehículo…
          </Text>
        </View>
      </View>
    );
  }

  // ───────────────────────────────────────────────────────────────────────
  // PANTALLA: sin vehículo registrado
  // ───────────────────────────────────────────────────────────────────────

  if (!car) {
    return (
      <View
        style={[styles.safeContainer, { paddingTop: insets.top }]}
      >
        <StatusBar style="light" backgroundColor="#A10F2D" />
        <View style={styles.loadingContainer}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButtonCentered}
            accessibilityLabel="Volver"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={22}
              color="#A10F2D"
            />
          </TouchableOpacity>
          <MaterialCommunityIcons
            name="car-off"
            size={60}
            color="rgba(255,255,255,0.6)"
          />
          <Text style={styles.loadingText}>
            No hay vehículo registrado asociado a tu cuenta.
          </Text>
        </View>
      </View>
    );
  }

  // ───────────────────────────────────────────────────────────────────────
  // RENDER PRINCIPAL
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
            <Text style={styles.headerTitle}>
              Editar Informacion del Vehiculo
            </Text>
            <Text style={styles.headerSubtitle}>
              Modifica solo los campos que deseas actualizar
            </Text>
          </View>

          {/* ── Tarjeta del formulario ── */}
          <View style={styles.formCard}>
            {/* ── Selector de foto de vehiculo ── */}
            <ProfilePicker
              onImageSelected={(img) => setProfileImage(img)}
              initialUri={car?.foto_url ?? undefined}
            />

            {/* ── Fila: Modelo | Marca ── */}
            <View style={styles.row}>
              <View style={styles.halfField}>
                <Input
                  label="Modelo"
                  placeholder={original.modelo || "Modelo"}
                  value={modelo}
                  onChangeText={(t) => {
                    setModelo(t);
                    if (modeloError) setModeloError("");
                  }}
                  error={modeloError}
                  autoCapitalize="words"
                  autoComplete="off"
                />
              </View>
              <View style={styles.halfFieldRight}>
                <Input
                  label="Marca"
                  placeholder={original.marca || "Marca"}
                  value={marca}
                  onChangeText={(t) => {
                    setMarca(t);
                    if (marcaError) setMarcaError("");
                  }}
                  error={marcaError}
                  autoCapitalize="words"
                  autoComplete="off"
                />
              </View>
            </View>

            {/* ── Fila: Año | Estado ── */}
            <View style={styles.row}>
              <View style={styles.halfField}>
                <Input
                  label="Año"
                  placeholder={original.año || "Año"}
                  value={año}
                  onChangeText={(t) => {
                    setAño(t);
                    if (añoError) setAñoError("");
                  }}
                  error={añoError}
                  keyboardType="number-pad"
                  autoComplete="off"
                />
              </View>
              <View style={styles.halfFieldRight}>
                <Input
                  label="Estado"
                  placeholder={original.estado || "Estado"}
                  value={estado}
                  onChangeText={(t) => {
                    setEstado(t);
                    if (estadoError) setEstadoError("");
                  }}
                  error={estadoError}
                  autoCapitalize="words"
                  autoComplete="off"
                />
              </View>
            </View>

            {/* ── Fila: Maletero Amplio | Número de Asientos ── */}
            <View style={styles.row}>
              <View style={styles.halfField}>
                <Input
                  label="Maletero Amplio"
                  placeholder={original.maletero_amplio || "Maletero Amplio"}
                  value={maletero_amplio}
                  onChangeText={(t) => {
                    setMaletero_amplio(t);
                    if (maletero_amplioError) setMaletero_amplioError("");
                  }}
                  error={maletero_amplioError}
                  autoCapitalize="words"
                  autoComplete="off"
                />
              </View>
              <View style={styles.halfFieldRight}>
                <Input
                  label="N° de Asientos"
                  placeholder={original.numero || "N° de Asientos"}
                  value={numero}
                  onChangeText={(t) => {
                    setNumero(t);
                    if (numeroError) setNumeroError("");
                  }}
                  error={numeroError}
                  keyboardType="number-pad"
                  autoComplete="off"
                />
              </View>
            </View>

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
        title="¡Vehículo actualizado!"
        message="Los cambios se guardaron correctamente."
        onClose={() => {
          setShowSuccessModal(false);
          router.back();
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

  // ── Carga / Sin vehículo ──
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 32,
  },
  loadingText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  backButtonCentered: {
    position: "absolute",
    top: 16,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
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
