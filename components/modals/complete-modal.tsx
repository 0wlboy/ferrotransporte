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

interface CompleteModalProps {
  visible: boolean;
  onClose: () => void;
  onCompleteTrip: () => void;
}

export default function CompleteModal({
  visible,
  onClose,
  onCompleteTrip,
}: CompleteModalProps) {
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
              {/* Ícono de confirmación */}
              <View style={styles.iconWrapper}>
                <MaterialCommunityIcons
                  name="check-circle-outline"
                  size={42}
                  color="#2E7D32"
                />
              </View>

              {/* Título */}
              <Text style={styles.title}>Finalizar Viaje</Text>

              {/* Mensaje descriptivo */}
              <Text style={styles.message}>
                ¿Estás seguro de que deseas finalizar este viaje? El servicio
                se registrará como completado.
              </Text>

              {/* Botones */}
              <View style={styles.buttonsRow}>
                {/* Cancelar/Cerrar (botón transparente con borde coloreado) */}
                <TouchableOpacity
                  style={styles.closeButton}
                  activeOpacity={0.8}
                  onPress={onClose}
                  accessibilityLabel="Cerrar modal"
                  accessibilityRole="button"
                >
                  <Text style={styles.closeButtonText}>Cerrar</Text>
                </TouchableOpacity>

                {/* Finalizar viaje (botón coloreado verde) */}
                <TouchableOpacity
                  style={styles.completeButton}
                  activeOpacity={0.8}
                  onPress={onCompleteTrip}
                  accessibilityLabel="Confirmar finalización de viaje"
                  accessibilityRole="button"
                >
                  <Text style={styles.completeButtonText}>Finalizar</Text>
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
    backgroundColor: "rgba(46, 125, 50, 0.08)",
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
  closeButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#888888",
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#666666",
  },
  completeButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#2E7D32",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
