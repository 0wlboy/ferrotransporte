import { Colors } from "@/constants/theme";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React from "react";
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
export type TripStatus =
  | "Completado"
  | "Cancelado"
  | "En Camino"
  | "Pendiente"
  | "En Sitio";

function getStatusColor(estado: TripStatus): string {
  switch (estado) {
    case "Completado":
      return "#adc9afff";
    case "Cancelado":
      return "#C62828";
    case "En Camino":
      return "#1565C0";
    case "En Sitio":
      return "#D84315";
    case "Pendiente":
      return "#E65100";
    default:
      return "#757575";
  }
}

function getPriorityColor(prioridad?: string): string {
  switch (prioridad) {
    case "Alta":
      return "#C62828";
    default:
      return "#B8400A";
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
  const prioritColor = getPriorityColor(data.prioridad);
  const labelUser = viewerRole === "Conductor" ? "Pasajero" : "Conductor";
  return (
    <>
      <TouchableOpacity
        style={styles.tripCard}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={0.8}
      >
        {/* Fila superior: foto + nombre + origen/destino */}
        <View style={[styles.tripCardTop, { alignItems: "flex-start" }]}>
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
            <View>
              <Text style={styles.tripUserLabel}>{labelUser}:</Text>
              <Text style={styles.tripUserName}>{data.userNombre}</Text>
            </View>

            <View style={styles.tripPetitionInfoContainer}>
              <View style={styles.tripInfoRow}>
                <Text style={styles.tripInfoLabel}>Acompañantes: </Text>
                <Text style={styles.tripInfoData}>{data.acompañantes}</Text>
              </View>
              <View style={styles.tripInfoColumn}>
                <Text style={styles.tripInfoLabel}>Carga: </Text>
                <Text
                  style={styles.tripInfoData}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {data.carga || "Sin carga"}
                </Text>
              </View>
            </View>
          </View>

          {/* Origen → Destino */}
          <View style={styles.tripRoute}>
            <View style={styles.tripRouteRow}>
              <Text style={styles.tripRouteValue}>{data.origen}</Text>
            </View>
            <View style={styles.tripArrowRow}>
              <MaterialCommunityIcons
                name="arrow-down"
                size={18}
                color={Colors.light.tint}
                style={styles.tripArrowIcon}
              />
            </View>
            <View style={styles.tripRouteRow}>
              <Text style={styles.tripRouteValue}>{data.destino}</Text>
            </View>
          </View>
        </View>

        {/* Fila inferior: fecha + prioridad */}
        <View style={styles.tripCardBottom}>
          <View style={styles.dateContainer}>
            <Text style={styles.tripDateLabel}>Fecha: </Text>
            <Text style={styles.tripDateText}>
              {data.fecha}
              {"  "}
              {data.hora}
            </Text>
          </View>
          <View style={styles.priorityContainer}>
            <Text style={styles.tripPriorityLabel}>Prioridad: </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: prioritColor, marginLeft: 4 },
              ]}
            >
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
  viewerRole: string;
}

export function PetitionCardBig({
  visible,
  onClose,
  data,
  onAccept,
  viewerRole,
}: PetitionCardBigProps) {
  if (!data) return null;

  const labelText = viewerRole === "Conductor" ? "Pasajero:" : "Conductor:";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.tripCard,
            { width: "90%", maxWidth: 400, elevation: 5 },
          ]}
        >
          {/* Fila superior: foto + nombre + origen/destino */}
          <View style={[styles.tripCardTop, { alignItems: "flex-start" }]}>
            {/* Avatar del conductor/usuario */}
            <View style={styles.avatarContainer}>
              {data.conductorFoto || data.userFoto ? (
                <Image
                  source={{ uri: data.conductorFoto || data.userFoto }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <MaterialCommunityIcons
                    name="account"
                    size={28}
                    color="#888"
                  />
                </View>
              )}
            </View>

            {/* Nombre del conductor/usuario */}
            <View style={styles.tripUserInfo}>
              <Text style={styles.tripUserLabel}>{labelText}</Text>
              <Text style={styles.tripUserName}>{data.userNombre}</Text>
              <View style={styles.tripPetitionInfoContainer}>
                <View style={styles.tripInfoRow}>
                  <Text style={styles.tripInfoLabel}>Acompañantes: </Text>
                  <Text style={styles.tripInfoData}>
                    {data.acompañantes ?? 0}
                  </Text>
                </View>
                <View style={styles.tripInfoColumn}>
                  <Text style={styles.tripInfoLabel}>Carga: </Text>
                  <Text style={styles.tripInfoData}>
                    {data.carga ?? "Ninguna"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Origen → Destino */}
            <View style={styles.tripRoute}>
              <View style={styles.tripRouteRow}>
                <Text style={styles.tripRouteValue}>{data.origen}</Text>
              </View>
              <View style={styles.tripArrowRow}>
                <MaterialCommunityIcons
                  name="arrow-down"
                  size={18}
                  color={Colors.light.tint}
                  style={styles.tripArrowIcon}
                />
              </View>
              <View style={styles.tripRouteRow}>
                <Text style={styles.tripRouteValue}>{data.destino}</Text>
              </View>
            </View>
          </View>

          {/* Fila inferior: fecha + prioridad */}
          <View style={styles.tripCardBottom}>
            <View style={styles.dateContainer}>
              <Text style={styles.tripDateLabel}>Fecha: </Text>
              <Text style={styles.tripDateText}>
                {data.fecha}
                {"  "}
                {data.hora}
              </Text>
            </View>
            <View style={styles.priorityContainer}>
              <Text style={styles.tripPriorityLabel}>Prioridad: </Text>
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
                style={[
                  styles.tripActionButtonText,
                  styles.closeModalButtonText,
                ]}
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

export function ActiveTripCard({
  data,
  viewerRole,
  onStatusChange,
  disabled,
}: {
  data: TripRecord;
  viewerRole: "Conductor" | "Pasajero";
  onStatusChange: (status: string) => Promise<void>;
  disabled?: boolean;
}) {
  if (!data) return null;

  const labelText = viewerRole === "Conductor" ? "Conductor:" : "Pasajero:";

  // Get name and photo of the other party
  const displayName = data.userNombre || data.conductorNombre || "Por asignar";
  const displayFoto = data.userFoto || data.conductorFoto;

  return (
    <View
      style={[
        styles.tripCard,
        { marginBottom: 16, elevation: 3, borderColor: Colors.light.tint },
      ]}
    >
      {/* Fila superior: foto + nombre + origen/destino */}
      <View style={[styles.tripCardTop, { alignItems: "flex-start" }]}>
        {/* Avatar del conductor/usuario */}
        <View style={styles.avatarContainer}>
          {displayFoto ? (
            <Image source={{ uri: displayFoto }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialCommunityIcons name="account" size={28} color="#888" />
            </View>
          )}
        </View>

        {/* Nombre del conductor/usuario */}
        <View style={styles.tripUserInfo}>
          <Text style={styles.tripUserLabel}>{labelText}</Text>
          <Text style={styles.tripUserName}>{displayName}</Text>
          <View style={styles.tripPetitionInfoContainer}>
            <View style={styles.tripInfoRow}>
              <Text style={styles.tripInfoLabel}>Acompañantes: </Text>
              <Text style={styles.tripInfoData}>{data.acompañantes ?? 0}</Text>
            </View>
            <View style={styles.tripInfoColumn}>
              <Text style={styles.tripInfoLabel}>Carga: </Text>
              <Text style={styles.tripInfoData}>{data.carga || "Ninguna"}</Text>
            </View>
          </View>
        </View>

        {/* Origen → Destino */}
        <View style={styles.tripRoute}>
          <View style={styles.tripRouteRow}>
            <Text style={styles.tripRouteValue}>{data.origen}</Text>
          </View>
          <View style={styles.tripArrowRow}>
            <MaterialCommunityIcons
              name="arrow-down"
              size={18}
              color={Colors.light.tint}
              style={styles.tripArrowIcon}
            />
          </View>
          <View style={styles.tripRouteRow}>
            <Text style={styles.tripRouteValue}>{data.destino}</Text>
          </View>
        </View>
      </View>

      {/* Fila inferior: fecha + estado */}
      <View style={styles.tripCardBottom}>
        <View style={styles.dateContainer}>
          <Text style={styles.tripDateLabel}>Fecha: </Text>
          <Text style={styles.tripDateText}>
            {data.fecha}
            {"  "}
            {data.hora}
          </Text>
        </View>
        <View style={styles.priorityContainer}>
          <Text style={styles.tripPriorityLabel}>Estado: </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(data.estado ?? "En Camino") },
            ]}
          >
            <Text style={styles.statusBadgeText}>
              {data.estado ?? "En Camino"}
            </Text>
          </View>
        </View>
      </View>

      {/* Separador */}
      <View style={styles.tripDivider} />

      {/* Descripción */}
      <View style={styles.tripDescriptionContainer}>
        <Text style={styles.tripDescriptionLabel}>Descripcion</Text>
        <View style={styles.descriptionBox}>
          <Text style={styles.descriptionText}>
            {data.descripcion || "Sin descripción"}
          </Text>
        </View>
      </View>

      {/* Acciones */}
      <View style={styles.tripActionsContainer}>
        {viewerRole === "Pasajero" ? (
          <TouchableOpacity
            style={[
              styles.tripActionButton,
              styles.cancelBtnActive,
              disabled && { opacity: 0.5 },
            ]}
            onPress={() => onStatusChange("Cancelado")}
            disabled={disabled}
          >
            <Text style={styles.cancelBtnActiveText}>Cancelar</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[
                styles.tripActionButton,
                styles.cancelBtnActive,
                disabled && { opacity: 0.5 },
              ]}
              onPress={() => onStatusChange("Cancelado")}
              disabled={disabled}
            >
              <Text style={styles.cancelBtnActiveText}>Cancelar</Text>
            </TouchableOpacity>

            {data.estado === "En Sitio" ? (
              <TouchableOpacity
                style={[
                  styles.tripActionButton,
                  styles.onTheWayBtnActive,
                  disabled && { opacity: 0.5 },
                ]}
                onPress={() => onStatusChange("En Camino")}
                disabled={disabled}
              >
                <Text style={styles.onTheWayBtnActiveText}>En Camino</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.tripActionButton,
                  styles.onSiteBtnActive,
                  disabled && { opacity: 0.5 },
                ]}
                onPress={() => onStatusChange("En Sitio")}
                disabled={disabled}
              >
                <Text style={styles.onSiteBtnActiveText}>En Sitio</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.tripActionButton,
                styles.completeBtnActive,
                disabled && { opacity: 0.5 },
              ]}
              onPress={() => onStatusChange("Completado")}
              disabled={disabled}
            >
              <Text style={styles.completeBtnActiveText}>Finalizar</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tripCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tripCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarContainer: {
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: Colors.light.tint,
    borderRadius: 30,
    padding: 2,
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
    fontSize: 11,
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
  tripInfoColumn: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  tripInfoLabel: {
    fontSize: 10,
    color: "#1A1A1A",
  },
  tripInfoData: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.light.tint,
    minWidth: 120,
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
    color: "#757575",
  },
  tripRouteValue: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  tripArrowRow: {
    alignItems: "flex-end",
    paddingRight: 12,
    marginVertical: 2,
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
    marginTop: 14,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  tripDateLabel: {
    fontSize: 10,
    color: "#1A1A1A",
  },
  tripDateText: {
    fontSize: 11,
    color: "#000",
    fontWeight: "700",
  },
  priorityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  tripPriorityLabel: {
    fontSize: 10,
    color: "#757575",
    fontWeight: "400",
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  statusBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },

  // ── Contenedor de descripción ───────────────────────────────────────────
  tripDescriptionContainer: {
    marginTop: 8,
  },
  tripDescriptionLabel: {
    fontSize: 10,
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
    fontSize: 11,
    color: "#333",
    lineHeight: 16,
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
  closeModalButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Colors.light.tint,
  },
  closeModalButtonText: {
    color: Colors.light.tint,
  },
  acceptModalButtonText: {
    color: "#FFFFFF",
  },
  cancelBtnActive: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#C62828",
  },
  cancelBtnActiveText: {
    color: "#C62828",
    fontWeight: "700",
    fontSize: 14,
  },
  onSiteBtnActive: {
    backgroundColor: "#D84315",
  },
  onSiteBtnActiveText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  onTheWayBtnActive: {
    backgroundColor: "#1565C0",
  },
  onTheWayBtnActiveText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  completeBtnActive: {
    backgroundColor: "#2E7D32",
  },
  completeBtnActiveText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
