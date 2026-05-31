import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TextArea } from "@/components/ui/text-area";
import { useAuth } from "@/context/auth-context";
import { useSendPetition } from "@/hooks/useSendPetition";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// ─────────────────────────────────────────────────────────────────────────────
// DATOS
// ─────────────────────────────────────────────────────────────────────────────

const Destinos = [
  "Gerencias",
  "Operaciones",
  "Mantenimiento",
  "Recursos Humanos",
  "Logística",
  "Administración",
  "Seguridad",
  "Tecnología",
];

const OpcionesPrioridad = ["Mediana", "Alta"];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE DROPDOWN LOCAL
// ─────────────────────────────────────────────────────────────────────────────

interface DropdownProps {
  label: string;
  selected: string;
  options: string[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
  zIndex?: number;
}

function Dropdown({
  label,
  selected,
  options,
  isOpen,
  onToggle,
  onSelect,
  zIndex = 10,
}: DropdownProps) {
  return (
    <View style={[styles.dropdownWrapper, { zIndex }]}>
      <Text style={styles.fieldLabel}>
        {label} <Text style={styles.required}>*</Text>
      </Text>
      <TouchableOpacity
        style={[styles.dropdownButton, isOpen && styles.dropdownButtonOpen]}
        onPress={onToggle}
        activeOpacity={0.8}
      >
        <Text style={styles.dropdownSelected}>{selected}</Text>
        <MaterialCommunityIcons name="chevron-down" size={22} color="#A10F2D" />
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.dropdownList}>
          {options.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.dropdownItem,
                item === selected && styles.dropdownItemActive,
              ]}
              onPress={() => onSelect(item)}
            >
              <Text
                style={[
                  styles.dropdownItemText,
                  item === selected && styles.dropdownItemTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PANTALLA PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export default function Petition() {
  const { sendPetition, isLoading } = useSendPetition();
  const { user } = useAuth();

  const [origen, setOrigen] = useState(Destinos[0]);
  const [destino, setDestino] = useState(Destinos[0]);
  const [pasajeros, setPasajeros] = useState("1");
  const [prioridad, setPrioridad] = useState(OpcionesPrioridad[0]);
  const [carga, setCarga] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const [pasajerosError, setPasajerosError] = useState("");

  const [showOrigen, setShowOrigen] = useState(false);
  const [showDestino, setShowDestino] = useState(false);
  const [showPrioridad, setShowPrioridad] = useState(false);

  // Cierra todos los dropdowns antes de abrir uno nuevo
  const openOrigen = () => {
    setShowDestino(false);
    setShowPrioridad(false);
    setShowOrigen((v) => !v);
  };
  const openDestino = () => {
    setShowOrigen(false);
    setShowPrioridad(false);
    setShowDestino((v) => !v);
  };
  const openPrioridad = () => {
    setShowOrigen(false);
    setShowDestino(false);
    setShowPrioridad((v) => !v);
  };

  // ── Validación y envío ──
  const handleRegister = async () => {
    let valid = true;

    const numPasajeros = Number(pasajeros);
    if (!pasajeros || isNaN(numPasajeros) || numPasajeros < 1) {
      setPasajerosError("Ingresa un número de pasajeros válido.");
      valid = false;
    }

    if (origen === destino) {
      Alert.alert("Error", "El origen y el destino no pueden ser iguales.");
      valid = false;
    }

    if (!valid) return;

    const success = await sendPetition({
      ci: user?.ci_user || "",
      origen,
      destino,
      pasajeros: numPasajeros,
      prioridad,
      carga,
    });

    if (success) {
      Alert.alert("Éxito", "Tu petición fue enviada correctamente.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } else {
      Alert.alert("Error", "No se pudo enviar la petición. Intenta de nuevo.");
    }
  };

  const original = useMemo(
    () => ({
      origen: origen,
      destino: destino,
    }),
    [],
  );

  const hasChanges = useMemo(() => {
    return (
      origen.trim() !== original.origen.trim() &&
      destino.trim() !== original.destino.trim()
    );
  }, [origen, destino, original]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#A10F2D" />

      {/* ── ENCABEZADO ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.8}
          style={styles.backButton}
          accessibilityLabel="Volver"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#A10F2D" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>¿A Donde se{"\n"}Dirige?</Text>
      </View>

      {/* ── TARJETA BLANCA ── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Origen */}
        <Dropdown
          label="Origen"
          selected={origen}
          options={Destinos}
          isOpen={showOrigen}
          onToggle={openOrigen}
          onSelect={(v) => {
            setOrigen(v);
            setShowOrigen(false);
          }}
          zIndex={30}
        />

        {/* Separador con flecha */}
        <View style={styles.arrowSeparator}>
          <View style={styles.arrowDot} />
          <View style={styles.arrowDot} />
          <MaterialCommunityIcons name="arrow-down" size={18} color="#A10F2D" />
        </View>

        {/* Destino */}
        <Dropdown
          label="Destino"
          selected={destino}
          options={Destinos}
          isOpen={showDestino}
          onToggle={openDestino}
          onSelect={(v) => {
            setDestino(v);
            setShowDestino(false);
          }}
          zIndex={20}
        />

        {/* Fila: Pasajeros | Prioridad */}
        <View style={styles.row}>
          {/* Pasajeros */}
          <View style={styles.halfLeft}>
            <Input
              label="Pasajeros *"
              placeholder="1"
              value={pasajeros}
              onChangeText={(t) => {
                setPasajeros(t);
                if (pasajerosError) setPasajerosError("");
              }}
              error={pasajerosError}
              inputMode="numeric"
              keyboardType="numeric"
            />
          </View>

          {/* Prioridad */}
          <View style={[styles.halfRight, { zIndex: 10 }]}>
            <Dropdown
              label="Prioridad"
              selected={prioridad}
              options={OpcionesPrioridad}
              isOpen={showPrioridad}
              onToggle={openPrioridad}
              onSelect={(v) => {
                setPrioridad(v);
                setShowPrioridad(false);
              }}
              zIndex={10}
            />
          </View>
        </View>

        {/* Carga */}
        <Input
          label="Carga"
          placeholder="1 impresora"
          value={carga}
          onChangeText={setCarga}
        />

        {/* Descripción de la petición */}
        <TextArea
          label="Descripcion de la peticion"
          placeholder="Mantenimiento preventivo en....."
          value={descripcion}
          onChangeText={setDescripcion}
          numberOfLines={5}
        />

        {/* Botón Enviar */}
        <Button
          title="Enviar"
          onPress={handleRegister}
          isLoading={isLoading}
          disabled={!hasChanges || isLoading}
          containerStyle={styles.submitButton}
        />
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#A10F2D",
  },

  // ── Header ──────────────────────────────────────────────────────────────

  header: {
    backgroundColor: "#A10F2D",
    paddingTop: (StatusBar.currentHeight ?? 44) + 12,
    paddingBottom: 28,
    paddingHorizontal: 20,
    gap: 16,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  headerTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 40,
    letterSpacing: -0.5,
  },

  // ── Scroll / Card ────────────────────────────────────────────────────────

  scrollView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },

  // ── Labels / Fields ──────────────────────────────────────────────────────

  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E1E1E",
    marginBottom: 6,
  },

  required: {
    color: "#A10F2D",
  },

  // ── Dropdown ─────────────────────────────────────────────────────────────

  dropdownWrapper: {
    marginBottom: 4,
  },

  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F5D6DB",
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 52,
  },

  dropdownButtonOpen: {
    borderColor: "#A10F2D",
    borderWidth: 1.5,
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
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
    maxHeight: 210,
    overflow: "hidden",
  },

  dropdownItem: {
    paddingVertical: 13,
    paddingHorizontal: 16,
  },

  dropdownItemActive: {
    backgroundColor: "#FFF5F7",
  },

  dropdownItemText: {
    fontSize: 15,
    color: "#2E2E2E",
  },

  dropdownItemTextActive: {
    fontWeight: "700",
    color: "#A10F2D",
  },

  // ── Separador con flecha ─────────────────────────────────────────────────

  arrowSeparator: {
    alignItems: "flex-end",
    paddingRight: 14,
    marginVertical: 2,
    gap: 2,
  },

  arrowDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#A10F2D",
  },

  // ── Fila pasajeros / prioridad ───────────────────────────────────────────

  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 0,
  },

  halfLeft: {
    flex: 1,
  },

  halfRight: {
    flex: 1.5,
  },

  // ── Botón ────────────────────────────────────────────────────────────────

  submitButton: {
    marginTop: 8,
    borderRadius: 14,
  },
});
