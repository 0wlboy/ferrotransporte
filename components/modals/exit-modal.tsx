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

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────

interface ExitModalProps {
  /** Controla si el modal está visible */
  visible: boolean;
  /** Callback al presionar "Cancelar" o tocar el fondo oscuro */
  onCancel: () => void;
  /** Callback al presionar "Salir" (confirmar cierre de sesión) */
  onConfirm: () => void;
  /** Si true, muestra un indicador de carga en el botón de salir */
  loading?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ExitModal — Modal de confirmación para cerrar sesión.
 *
 * Muestra un overlay semitransparente oscuro y una tarjeta centrada con
 * animación de escala y opacidad. El usuario puede confirmar o cancelar.
 */
export default function ExitModal({
  visible,
  onCancel,
  onConfirm,
  loading = false,
}: ExitModalProps) {
  // Valores de animación
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animación de entrada: escala + opacidad
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
      // Reset para próxima apertura
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
      onRequestClose={onCancel}
    >
      {/* Overlay oscuro — al tocarlo se cancela */}
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          {/* Tarjeta del modal — stopPropagation implícito con su propio TouchableWithoutFeedback */}
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
                  name="logout-variant"
                  size={36}
                  color="#A10F2D"
                />
              </View>

              {/* Título */}
              <Text style={styles.title}>Cerrar Sesión</Text>

              {/* Mensaje descriptivo */}
              <Text style={styles.message}>
                ¿Estás seguro de que deseas cerrar tu sesión? Tendrás que
                volver a iniciarla para acceder a la app.
              </Text>

              {/* Botones */}
              <View style={styles.buttonsRow}>
                {/* Cancelar */}
                <TouchableOpacity
                  style={styles.cancelButton}
                  activeOpacity={0.8}
                  onPress={onCancel}
                  accessibilityLabel="Cancelar cierre de sesión"
                  accessibilityRole="button"
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                {/* Salir */}
                <TouchableOpacity
                  style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
                  activeOpacity={0.8}
                  onPress={onConfirm}
                  accessibilityLabel="Confirmar cierre de sesión"
                  accessibilityRole="button"
                  disabled={loading}
                >
                  <Text style={styles.confirmButtonText}>
                    {loading ? "Saliendo…" : "Salir"}
                  </Text>
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
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────

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
    backgroundColor: "#FFF0F2",
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
    borderColor: "#D0D0D5",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4A4A4A",
  },
  confirmButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#A10F2D",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#A10F2D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
