import { Colors } from "@/constants/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export type SortField = "estado" | "fecha" | "pasajeros";
export type SortDirection = "Ascendente" | "Descendente";

interface OrdenModalProps {
  /** Controls visibility of the modal */
  visible: boolean;
  /** Callback when close button or background overlay is pressed */
  onClose: () => void;
  /** Currently active sorting field */
  currentField: SortField;
  /** Callback to update active sorting field */
  onSelectField: (field: SortField) => void;
  /** Currently active sorting direction */
  currentDirection: SortDirection;
  /** Callback to update sorting direction */
  onSelectDirection: (direction: SortDirection) => void;
}

/**
 * OrdenModal — Animated modal to configure sorting parameters.
 * Matches the layout and premium aesthetic from the design mock-up:
 * - Mutually exclusive checkboxes for Ascendente / Descendente.
 * - Mutually exclusive pill buttons for Estado / Fecha / Pasajeros.
 * - Rose-burgundy / dark-wine color scheme.
 */
export default function OrdenModal({
  visible,
  onClose,
  currentField,
  onSelectField,
  currentDirection,
  onSelectDirection,
}: OrdenModalProps) {
  // Animation refs for premium spring entry
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 18,
          stiffness: 280,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Semi-transparent dark overlay */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          {/* Card containing the sort options */}
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.card,
                {
                  transform: [{ scale: scaleAnim }],
                  opacity: opacityAnim,
                },
              ]}
            >
              {/* Header: Title and Close button */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Orden</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                  activeOpacity={0.7}
                  accessibilityLabel="Cerrar modal de orden"
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={22}
                    color={Colors.light.tint}
                  />
                </TouchableOpacity>
              </View>

              {/* Checkboxes: Ascendente & Descendente */}
              <View style={styles.directionSection}>
                {/* Ascendente */}
                <TouchableOpacity
                  style={styles.checkboxRow}
                  activeOpacity={0.8}
                  onPress={() => onSelectDirection("Ascendente")}
                >
                  <MaterialCommunityIcons
                    name={
                      currentDirection === "Ascendente"
                        ? "checkbox-marked-outline"
                        : "checkbox-blank-outline"
                    }
                    size={24}
                    color={Colors.light.tint}
                  />
                  <Text style={styles.checkboxText}>Ascendente</Text>
                </TouchableOpacity>

                {/* Descendente */}
                <TouchableOpacity
                  style={styles.checkboxRow}
                  activeOpacity={0.8}
                  onPress={() => onSelectDirection("Descendente")}
                >
                  <MaterialCommunityIcons
                    name={
                      currentDirection === "Descendente"
                        ? "checkbox-marked-outline"
                        : "checkbox-blank-outline"
                    }
                    size={24}
                    color={Colors.light.tint}
                  />
                  <Text style={styles.checkboxText}>Descendente</Text>
                </TouchableOpacity>
              </View>

              {/* Horizontal Divider */}
              <View style={styles.divider} />

              {/* Criteria Pills Stack */}
              <View style={styles.pillsContainer}>
                {/* Estado */}
                <TouchableOpacity
                  style={[
                    styles.pillButton,
                    currentField === "estado"
                      ? styles.pillActive
                      : styles.pillInactive,
                  ]}
                  activeOpacity={0.85}
                  onPress={() => onSelectField("estado")}
                >
                  <Text style={styles.pillText}>Estado</Text>
                </TouchableOpacity>

                {/* Fecha */}
                <TouchableOpacity
                  style={[
                    styles.pillButton,
                    currentField === "fecha"
                      ? styles.pillActive
                      : styles.pillInactive,
                  ]}
                  activeOpacity={0.85}
                  onPress={() => onSelectField("fecha")}
                >
                  <Text style={styles.pillText}>Fecha</Text>
                </TouchableOpacity>

                {/* Pasajeros */}
                <TouchableOpacity
                  style={[
                    styles.pillButton,
                    currentField === "pasajeros"
                      ? styles.pillActive
                      : styles.pillInactive,
                  ]}
                  activeOpacity={0.85}
                  onPress={() => onSelectField("pasajeros")}
                >
                  <Text style={styles.pillText}>Pasajeros</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 36,
  },
  card: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#5C0614", // Deep rich burgundy/wine for modal titles
  },
  closeButton: {
    padding: 4,
  },
  directionSection: {
    gap: 12,
    marginBottom: 16,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkboxText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#A4032B", // Matches active state/tint color
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 4,
    marginBottom: 16,
  },
  pillsContainer: {
    gap: 12,
  },
  pillButton: {
    width: "100%",
    height: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  // Active pill has a very dark, rich wine background
  pillActive: {
    backgroundColor: "#5C0614", 
  },
  // Inactive pill has a dusty rose/burgundy background
  pillInactive: {
    backgroundColor: "#B26675",
  },
  pillText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
});
