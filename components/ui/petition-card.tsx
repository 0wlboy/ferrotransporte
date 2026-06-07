import { Colors } from "@/constants/theme";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React from "react";
import { Image, StyleSheet, Text, View, TouchableOpacity, Modal } from "react-native";

export interface TripRecord {
  id: string;
  userNombre: string;
  userFoto?: string;
  conductorNombre?: string;
  conductorFoto?: string;
  origen: string;
  acompañantes?: number;
  carga?: string;
  destino: string;
  fecha: string;
  hora: string;
  prioridad: TripPriority;
  motivo?: string;
  estado?: TripStatus;
  descripcion?: string;
}

export type TripPriority = "Media" | "Alta";
export type TripStatus = "Completado" | "Cancelado" | "En Camino" | "Pendiente";

function getPrioridadColor(estado: TripPriority): string {
  switch (estado) {
    case "Media":
      return "#2E7D32";
    case "Alta":
      return "#C62828";
    default:
      return "#757575";
  }
}

function getStatusColor(estado: TripStatus): string {
  switch (estado) {
    case "Completado":
      return "#2E7D32";
    case "Cancelado":
      return "#C62828";
    case "En Camino":
      return "#1565C0";
    case "Pendiente":
      return "#E65100";
    default:
      return "#757575";
  }
}

function getPriorityColor(prioridad?: string): string {
  switch (prioridad?.toLowerCase()) {
    case "alta":
      return "#C62828";
    case "mediana":
    case "media":
      return "#E65100";
    case "baja":
      return "#2E7D32";
    default:
      return "#E65100";
  }
}

export function PetitionCardSmall({
  data,
  viewerRole,
  onPress,
}: {
  data: TripRecord;
  viewerRole: "Conductor" | "Pasajero";
  onPress?: () => void;
}) {
  const prioridadColor = getPrioridadColor(data.prioridad);
  return (
    <>
      <TouchableOpacity
        style={styles.tripCard}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={0.8}
      >
        {/* Fila superior: foto + nombre + origen/destino */}
        <View style={styles.tripCardTop}>
          {/* Avatar del conductor/usuario */}
          <View style={styles.avatarContainer}>
            {data.userFoto || data.conductorFoto ? (
              <Image
                source={{ uri: data.userFoto || data.conductorFoto }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialCommunityIcons name="account" size={28} color="#888" />
              </View>
            )}
          </View>

          <View style={styles.tripUserInfo}>
            {viewerRole === "Conductor" && (
              <View>
                <Text style={styles.tripUserLabel}>Pasajero</Text>
                <Text style={styles.tripUserName}>{data.userNombre || data.conductorNombre}</Text>
              </View>
            )}

            {viewerRole === "Pasajero" && (
              <View>
                <Text style={styles.tripUserLabel}>Conductor</Text>
                <Text style={styles.tripUserName}>{data.userNombre || data.conductorNombre}</Text>
              </View>
            )}

            <View style={styles.tripPetitionInfoContainer}>
              <View style={styles.tripInfoRow}>
                <Text style={styles.tripInfoLabel}>Acompañantes: </Text>
                <Text style={styles.tripInfoData}>{data.acompañantes}</Text>
              </View>
              <View style={styles.tripInfoRow}>
                <Text style={styles.tripInfoLabel}>Carga: </Text>
                <Text style={styles.tripInfoData}>{data.carga || "Sin carga"}</Text>
              </View>
            </View>
          </View>

          {/* Origen → Destino */}
          <View style={styles.tripRoute}>
            <View style={styles.tripRouteRow}>
              <Text style={styles.tripRouteLabel}>Origen </Text>
              <Text style={styles.tripRouteValue}>{data.origen}</Text>
            </View>
            <View style={styles.tripArrowRow}>
              <MaterialCommunityIcons
                name="arrow-down"
                size={14}
                color={Colors.light.tint}
                style={styles.tripArrowIcon}
              />
            </View>
            <View style={styles.tripRouteRow}>
              <Text style={styles.tripRouteLabel}>Destino </Text>
              <Text style={styles.tripRouteValue}>{data.destino}</Text>
            </View>
          </View>
        </View>

        {/* Separador */}
        <View style={styles.tripDivider} />

        {/* Fila inferior: fecha + prioridad */}
        <View style={styles.tripCardBottom}>
          <Text style={styles.tripDateLabel}>Fecha: </Text>
          <Text style={styles.tripDateText}>
            {data.fecha}
            {"  "}
            {data.hora}
          </Text>
          <View style={styles.priorityContainer}>
            <Text style={styles.tripPriorityLabel}>
              Prioridad:
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: prioridadColor, marginLeft: 4 }]}>
              <Text style={styles.statusBadgeText}>{data.prioridad}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </>
  );
}

export interface PetitionCardBigProps {
  visible: boolean;
  onClose: () => void;
  data: TripRecord | null;
  onAccept?: () => void;
}

export function PetitionCardBig({
  visible,
  onClose,
  data,
  onAccept,
}: PetitionCardBigProps) {
  if (!data) return null;

  const isPending = data.estado === "Pendiente";
  const labelText = isPending ? "Usuario:" : "Conductor:";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {/* Fila superior: foto + nombre + origen/destino */}
          <View style={styles.tripCardTop}>
            {/* Avatar del conductor/usuario */}
            <View style={[styles.avatarContainer, styles.avatarContainerBig]}>
              {data.conductorFoto || data.userFoto ? (
                <Image
                  source={{ uri: data.conductorFoto || data.userFoto }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <MaterialCommunityIcons name="account" size={28} color="#888" />
                </View>
              )}
            </View>

            {/* Nombre del conductor/usuario */}
            <View style={styles.tripConductorInfo}>
              <Text style={styles.tripConductorLabel}>{labelText}</Text>
              <Text style={styles.tripConductorName}>
                {data.conductorNombre || data.userNombre}
              </Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoText}>
                  Acomp.: <Text style={styles.infoValue}>{data.acompañantes ?? 0}</Text>
                </Text>
                <Text style={styles.infoText}>
                  {"  "}Carga: <Text style={styles.infoValue}>{data.carga ?? "Ninguna"}</Text>
                </Text>
              </View>
            </View>

            {/* Origen → Destino */}
            <View style={styles.tripRoute}>
              <View style={styles.tripRouteRow}>
                <Text style={styles.tripRouteLabel}>Origen </Text>
                <Text style={styles.tripRouteValue}>{data.origen}</Text>
              </View>
              <View style={styles.tripArrowRow}>
                <MaterialCommunityIcons
                  name="arrow-down"
                  size={14}
                  color={Colors.light.tint}
                  style={styles.tripArrowIcon}
                />
              </View>
              <View style={styles.tripRouteRow}>
                <Text style={styles.tripRouteLabel}>Destino </Text>
                <Text style={styles.tripRouteValue}>{data.destino}</Text>
              </View>
            </View>
          </View>

          {/* Separador */}
          <View style={styles.tripDivider} />

          {/* Fila inferior: fecha + prioridad */}
          <View style={styles.tripCardBottom}>
            <Text style={styles.tripDateText}>
              Fecha: {data.fecha}
              {"  "}
              {data.hora}
            </Text>
            <View style={styles.priorityContainer}>
              <Text style={styles.priorityLabel}>Prioridad: </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getPriorityColor(data.prioridad) },
                ]}
              >
                <Text style={styles.statusBadgeText}>
                  {data.prioridad ?? "Mediana"}
                </Text>
              </View>
            </View>
          </View>

          {/* Separador */}
          <View style={styles.tripDivider} />

          <View style={styles.tripDescriptionContainer}>
            <Text style={styles.tripDescriptionLabel}>Descripcion</Text>
            <View style={styles.descriptionBox}>
              <Text style={styles.descriptionText}>
                {data.descripcion || "Sin descripción"}
              </Text>
            </View>
          </View>

          <View style={styles.tripActionsContainer}>
            <TouchableOpacity
              style={[
                styles.tripActionButton,
                styles.closeModalButton,
                (!onAccept || data.estado !== "Pendiente") && {
                  width: "100%",
                  flex: undefined,
                },
              ]}
              onPress={onClose}
            >
              <Text
                style={[styles.tripActionButtonText, styles.closeModalButtonText]}
              >
                Cerrar
              </Text>
            </TouchableOpacity>
            {onAccept && data.estado === "Pendiente" && (
              <TouchableOpacity
                style={[styles.tripActionButton, styles.tripAcceptButton]}
                onPress={onAccept}
              >
                <Text
                  style={[
                    styles.tripActionButtonText,
                    styles.acceptModalButtonText,
                  ]}
                >
                  Aceptar
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  tripCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tripCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarContainer: {
    marginRight: 4,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EEEEEE",
    alignItems: "center",
    justifyContent: "center",
  },
  tripUserInfo: {
    flex: 1,
  },
  tripUserLabel: {
    fontSize: 10,
    color: "#888",
    marginBottom: 2,
  },
  tripUserName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  tripConductorInfo: {
    flex: 1,
  },
  tripConductorLabel: {
    fontSize: 11,
    color: "#888",
    marginBottom: 2,
  },
  tripConductorName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  tripPetitionInfoContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
    marginTop: 4,
  },
  tripInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  tripInfoLabel: {
    fontSize: 11,
    color: "#888",
  },
  tripInfoData: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.light.tint,
  },
  tripRoute: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  tripRouteRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  tripRouteLabel: {
    fontSize: 10,
    color: "#888",
  },
  tripRouteValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  tripArrowRow: {
    alignItems: "flex-end",
    paddingRight: 2,
  },
  tripArrowIcon: {
    marginVertical: -2,
  },

  // ── Divider ──────────────────────────────────────────────────────────────
  tripDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 10,
  },

  // ── Fila inferior de la tarjeta ───────────────────────────────────────────
  tripCardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tripDateLabel: {
    fontSize: 10,
    color: "#888",
  },
  tripDateText: {
    fontSize: 12,
    color: "#555",
  },
  priorityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  tripPriorityLabel: {
    fontSize: 10,
    color: "#888",
    fontWeight: "400",
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  // ── Contenedor de descripción ───────────────────────────────────────────
  tripDescriptionContainer: {
    marginTop: 8,
  },
  tripDescriptionLabel: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4,
  },
  descriptionBox: {
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  descriptionText: {
    fontSize: 13,
    color: "#333",
    lineHeight: 18,
  },

  // ── Botones de acción ─────────────────────────────────────────────────────
  tripActionsContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  tripActionButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  tripAcceptButton: {
    backgroundColor: Colors.light.tint,
  },
  tripCancelButton: {
    borderColor: Colors.light.tint,
  },
  tripActionButtonText: {
    color: Colors.light.tint,
    fontSize: 14,
    fontWeight: "700",
  },

  // ── Modal Specific Styles ───────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    width: "90%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 5,
  },
  avatarContainerBig: {
    borderWidth: 1.5,
    borderColor: Colors.light.tint,
    borderRadius: 28,
    padding: 2,
  },
  infoRow: {
    flexDirection: "row",
    marginTop: 4,
  },
  infoText: {
    fontSize: 11,
    color: "#555",
  },
  infoValue: {
    fontWeight: "700",
    color: Colors.light.tint,
  },
  priorityContainerBig: {
    flexDirection: "row",
    alignItems: "center",
  },
  priorityLabel: {
    fontSize: 12,
    color: "#555",
  },
  closeModalButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  closeModalButtonText: {
    color: Colors.light.tint,
  },
  acceptModalButtonText: {
    color: "#FFFFFF",
  },
});
