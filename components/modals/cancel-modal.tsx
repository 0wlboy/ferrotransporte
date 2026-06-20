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

interface CancelModalProps {
  visible: boolean;
  onClose: () => void;
  onCancelTrip: () => void;
}

export default function CancelModal({
  visible,
  onClose,
  onCancelTrip,
}: CancelModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 18,
          stiffness: 260,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.85);
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
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
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
              {/* Ícono de advertencia */}
              <View style={styles.iconWrapper}>
                <MaterialCommunityIcons
                  name="close-circle-outline"
                  size={42}
                  color={Colors.light.tint}
                />
              </View>

              {/* Título */}
              <Text style={styles.title}>Cancelar Viaje</Text>

              {/* Mensaje descriptivo */}
              <Text style={styles.message}>
                ¿Estás seguro de que deseas cancelar este viaje? Esta acción no
                se puede deshacer.
              </Text>

              {/* Botones */}
              <View style={styles.buttonsRow}>
                {/* Cerrar modal (botón coloreado con el color de acento) */}
                <TouchableOpacity
                  style={styles.closeButton}
                  activeOpacity={0.8}
                  onPress={onClose}
                  accessibilityLabel="Cerrar modal de cancelación"
                  accessibilityRole="button"
                >
                  <Text style={styles.closeButtonText}>Cerrar</Text>
                </TouchableOpacity>

                {/* Cancelar viaje (botón transparente con borde coloreado) */}
                <TouchableOpacity
                  style={styles.cancelButton}
                  activeOpacity={0.8}
                  onPress={onCancelTrip}
                  accessibilityLabel="Confirmar cancelación del viaje"
                  accessibilityRole="button"
                >
                  <Text style={styles.cancelButtonText}>Cancelar viaje</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(164, 3, 43, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 10,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: "#6B6B6B",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 28,
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.light.tint,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.light.tint,
  },
  closeButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.light.tint,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
