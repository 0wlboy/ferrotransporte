import { Colors } from "@/constants/theme";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

export interface TripRecord {
  id: string;
  userNombre: string;
  userFoto?: string;
  origen: string;
  acompañantes?: number;
  carga?: string;
  destino: string;
  fecha: string;
  hora: string;
  prioridad: TripPriority;
  motivo?: string;
}

export type TripPriority = "Media" | "Alta";

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

export function PetitionCardSmall({ data, viewerRole }: { data: TripRecord, viewerRole: "Conductor" | "Pasajero" }) {
  const prioridadColor = getPrioridadColor(data.prioridad);
  return (
    <>
      <View style={styles.tripCard}>
        {/* Fila superior: foto + nombre + origen/destino */}
        <View style={styles.tripCardTop}>
          {/* Avatar del conductor */}
          <View style={styles.avatarContainer}>
            {data.userFoto ? (
              <Image
                source={{ uri: data.userFoto }}
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
                <Text style={styles.tripUserName}>{data.userNombre}</Text>
              </View>
            )}

            {viewerRole === "Pasajero" && (
              <View>
                <Text style={styles.tripUserLabel}>Conductor</Text>
                <Text style={styles.tripUserName}>{data.userNombre}</Text>
              </View>
            )}

            <View style={styles.tripPetitionInfoContainer}>
              <View style={styles.tripInfoRow}>
                <Text style={styles.tripInfoLabel}>Acompañantes: </Text>
                <Text style={styles.tripInfoData}>{data.acompañantes}</Text>
              </View>
              <View style={styles.tripInfoRow}>
                <Text style={styles.tripInfoLabel}>Carga: </Text>
                <Text style={styles.tripInfoData}>{data.carga}</Text>
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
        </View >

        {/* Separador */}
        < View style={styles.tripDivider} />

        {/* Fila inferior: fecha + prioridad */}
        < View style={styles.tripCardBottom} >
          <Text style={styles.tripDateLabel}>Fecha: </Text>
          <Text style={styles.tripDateText}>
            {data.fecha}
            {"  "}
            {data.hora}
          </Text>
          <View style={styles.priorityContainer} >
            <Text style={styles.tripPriorityLabel}>
              Prioridad:
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: prioridadColor }]}>
            <Text style={styles.statusBadgeText}>{data.prioridad}</Text>
          </View>
        </View >
      </View >
    </>
  );
}

interface PetitionCardBigProps {
  data: TripPriority;
  onAccept?: () => void;
  onCancel?: () => void;
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
    gap: 1,
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
});
