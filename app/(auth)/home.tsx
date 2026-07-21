import CancelModal from "@/components/modals/cancel-modal";
import CompleteModal from "@/components/modals/complete-modal";
import SuccessModal from "@/components/modals/success-modal";
import {
  ActiveTripCard,
  PetitionCardBig,
  PetitionCardSmall,
  TripPriority,
  TripRecord,
} from "@/components/ui/petition-card";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/auth-context";
import { useChangePetitionStatus } from "@/hooks/useChangePetitionStatus";
import { useGetPetition } from "@/hooks/useGetPetition";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Devuelve el saludo según la hora del día.
 */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 18) return "Buenas tardes";
  return "Buenas noches";
}

/**
 * Determina el texto y la ruta del botón principal según el rol del usuario.
 */
function getActionButton(role: string | null): {
  label: string;
  icon: string;
  route: string;
} {
  switch (role) {
    case "Conductor":
      return {
        label: "Ver Buzon de Entradas",
        icon: "mailbox-open-outline",
        route: "/(auth)/inbox",
      };
    case "Pasajero":
    default:
      return {
        label: "Pedir Vehículo",
        icon: "van-utility",
        route: "/(auth)/petition",
      };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PANTALLA PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  const { user } = useAuth();
  const { changePetitionStatus } = useChangePetitionStatus();
  const [selectedTrip, setSelectedTrip] = useState<TripRecord | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [showCompleteModal, setShowCompleteModal] = useState<boolean>(false);

  const greeting = getGreeting();
  const primer_nombre = user?.primer_nombre || "Usuario";
  const { label: actionLabel, icon: actionIcon } = getActionButton(
    user?.role ?? null,
  );

  // Fetch all user petitions reactively
  const {
    petitions: allPetitions = [],
    isLoading,
    refetch,
  } = useGetPetition({
    userId: user?.ci_user,
    role: user?.role,
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  // Active trip: for drivers, exclude Pendiente (not yet accepted).
  // For passengers, include Pendiente so they can see and cancel their pending request.
  const activeTripData = allPetitions.find((item) => {
    if (item.estado === "Cancelado" || item.estado === "Completado")
      return false;
    if (user?.role === "Conductor" && item.estado === "Pendiente") return false;
    return true;
  });

  // Convert active petition data to TripRecord format if it exists
  const activeTrip: TripRecord | null = activeTripData
    ? {
        id: activeTripData.id,
        userNombre:
          user?.role?.toLowerCase() === "conductor"
            ? activeTripData.usuario?.nombre || "Pasajero"
            : activeTripData.estado === "Pendiente"
              ? "Por Responder"
              : activeTripData.conductor?.nombre || "Por Asignar",
        userFoto:
          user?.role?.toLowerCase() === "conductor"
            ? activeTripData.usuario?.foto_url || undefined
            : activeTripData.conductor?.foto_url || undefined,
        origen: activeTripData.origen,
        destino: activeTripData.destino,
        acompañantes: activeTripData.acompañantes || 0,
        carga: activeTripData.carga || "Sin carga",
        fecha: new Date(activeTripData.created_at).toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
        hora: new Date(activeTripData.created_at).toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        prioridad: (activeTripData.prioridad as TripPriority) || undefined,
        estado: activeTripData.estado as any,
        descripcion: activeTripData.descripcion || "",
      }
    : null;

  // Filter completed petitions for the travel history (Historial de viajes)
  const completedPetitions = allPetitions.filter(
    (p) => p.estado === "Completado" || p.estado === "Cancelado",
  );
  const recentTrips = completedPetitions;

  // Check if passenger or driver has an active petition (Pending, En Camino, En Sitio, etc.)
  const hasActivePetition = allPetitions.some(
    (p) => p.estado !== "Completado" && p.estado !== "Cancelado",
  );

  const handleCancelTrip = async () => {
    if (!activeTrip) return;
    try {
      await changePetitionStatus({
        petitionId: activeTrip.id,
        status: "Cancelado",
      });
      setShowCancelModal(false);
      await refetch();
      Alert.alert("Éxito", "El viaje ha sido cancelado.");
    } catch (err) {
      console.error("Error al cancelar el viaje:", err);
      Alert.alert("Error", "No se pudo cancelar el viaje. Intente de nuevo.");
    }
  };

  const handleCompleteTrip = async () => {
    if (!activeTrip) return;
    try {
      await changePetitionStatus({
        petitionId: activeTrip.id,
        status: "Completado",
      });
      setShowCompleteModal(false);
      await refetch();
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Error al finalizar el viaje:", err);
      Alert.alert("Error", "No se pudo finalizar el viaje. Intente de nuevo.");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!activeTrip) return;

    if (newStatus === "Cancelado") {
      setShowCancelModal(true);
      return;
    }

    if (newStatus === "Completado") {
      setShowCompleteModal(true);
      return;
    }

    // Cambiar estado a "En Sitio" o "En Camino" de forma directa
    try {
      await changePetitionStatus({
        petitionId: activeTrip.id,
        status: newStatus,
      });
      await refetch();
    } catch (err) {
      console.error("Error al actualizar estado del viaje:", err);
      Alert.alert(
        "Error",
        "No se pudo actualizar el estado del viaje. Intente de nuevo.",
      );
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.light.tint} />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/images/ferrominera-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Botón de perfil */}
        <TouchableOpacity
          style={[styles.profileButton, isLoading && { opacity: 0.6 }]}
          onPress={() => router.push("/(auth)/profile" as any)}
          activeOpacity={0.8}
          disabled={isLoading}
        >
          {user?.foto_url ? (
            <Image
              source={{ uri: user.foto_url }}
              style={styles.profilePhoto}
            />
          ) : (
            <View style={styles.profilePhotoPlaceholder}>
              <MaterialCommunityIcons name="account" size={22} color="#888" />
            </View>
          )}
          <Text style={styles.profileButtonText}>PERFIL</Text>
        </TouchableOpacity>
      </View>

      {/* ── TÍTULO + SALUDO ── */}
      <View style={styles.titleSection}>
        <Text style={styles.titleText}>Inicio</Text>
        <Text style={styles.subtitleText}>
          {greeting}, {primer_nombre}
        </Text>
      </View>

      {/* ── CONTENIDO SCROLLEABLE ── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            colors={[Colors.light.tint]}
            tintColor={Colors.light.tint}
          />
        }
      >
        {/* ── VIAJE ACTIVO / PETICIÓN PENDIENTE ── */}
        {activeTrip && (
          <View style={styles.activeTripContainer}>
            <Text style={styles.sectionTitle}>
              {activeTrip.estado === "Pendiente" && user?.role === "Pasajero"
                ? "PETICIÓN PENDIENTE"
                : "VIAJE ACTIVO"}
            </Text>
            <ActiveTripCard
              data={activeTrip}
              viewerRole={user?.role as "Conductor" | "Pasajero"}
              onStatusChange={handleStatusChange}
              disabled={isLoading}
            />
          </View>
        )}

        {/* ── BOTÓN DE ACCIÓN PRINCIPAL ── */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            (hasActivePetition || isLoading) && styles.actionButtonDisabled,
          ]}
          activeOpacity={hasActivePetition || isLoading ? 1 : 0.85}
          disabled={hasActivePetition || isLoading}
          onPress={() => {
            router.push(getActionButton(user?.role ?? null).route as any);
          }}
        >
          <MaterialCommunityIcons
            name={actionIcon as any}
            size={48}
            color="#FFFFFF"
            style={[
              styles.actionIcon,
              (hasActivePetition || isLoading) && styles.actionIconDisabled,
            ]}
          />
          <Text
            style={[
              styles.actionButtonText,
              (hasActivePetition || isLoading) &&
                styles.actionButtonTextDisabled,
            ]}
          >
            {actionLabel}
          </Text>
        </TouchableOpacity>

        {/* ── HISTORIAL DE VIAJES ── */}
        <Text style={styles.sectionTitle}>HISTORIAL DE VIAJES</Text>

        {(recentTrips || []).slice(0, 2).map((item) => {
          const dateObj = new Date(item.created_at);
          const formattedDate = dateObj.toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });
          const formattedTime = dateObj.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });

          const isConductor = user?.role?.toLowerCase() === "conductor";
          const tripData: TripRecord = {
            id: item.id,
            userNombre: isConductor
              ? item.usuario?.nombre || "Pasajero"
              : item.conductor?.nombre || "Por Asignar",
            userFoto: isConductor
              ? item.usuario?.foto_url || undefined
              : item.conductor?.foto_url || undefined,
            origen: item.origen,
            destino: item.destino,
            acompañantes: item.acompañantes || 0,
            carga: item.carga || "Sin carga",
            fecha: formattedDate,
            hora: formattedTime,
            prioridad: (item.prioridad as TripPriority) || undefined,
            motivo: item.carga || undefined,
          };

          return (
            <PetitionCardSmall
              key={item.id}
              data={tripData}
              viewerRole={user?.role as "Conductor" | "Pasajero"}
            />
          );
        })}

        {/* ── VER MÁS ── */}
        <TouchableOpacity
          style={[styles.verMasButton, isLoading && { opacity: 0.6 }]}
          activeOpacity={0.85}
          disabled={isLoading}
          onPress={() => {
            router.push("/record");
          }}
        >
          <Text style={styles.verMasText}>Ver Mas</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── DETALLE DEL VIAJE MODAL ── */}
      {showModal && (
        <PetitionCardBig
          visible={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedTrip(null);
          }}
          data={selectedTrip}
          viewerRole={user?.role as any}
        />
      )}
      {showSuccessModal && (
        <SuccessModal
          visible={showSuccessModal}
          title="¡Viaje Finalizado!"
          message="El viaje ha sido completado y registrado con éxito."
          onClose={() => setShowSuccessModal(false)}
        />
      )}
      {showCancelModal && (
        <CancelModal
          visible={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onCancelTrip={handleCancelTrip}
        />
      )}
      {showCompleteModal && (
        <CompleteModal
          visible={showCompleteModal}
          onClose={() => setShowCompleteModal(false)}
          onCompleteTrip={handleCompleteTrip}
        />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.light.tint,
  },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    backgroundColor: Colors.light.tint,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 12,
  },
  logoContainer: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logo: {
    width: 44,
    height: 44,
  },
  profileButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  profilePhoto: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  profilePhotoPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
  },
  profileButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A1A1A",
    letterSpacing: 0.5,
  },

  // ── Título ──────────────────────────────────────────────────────────────
  titleSection: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  titleText: {
    fontSize: 42,
    fontWeight: "900",
    color: "#FFFFFF",
    lineHeight: 48,
  },
  subtitleText: {
    fontSize: 15,
    color: "#FFFFFF",
    opacity: 0.9,
    marginTop: 2,
  },

  // ── Scroll ──────────────────────────────────────────────────────────────
  scrollView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },

  // ── Botón de acción principal ────────────────────────────────────────────
  actionButton: {
    backgroundColor: Colors.light.tint,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    paddingHorizontal: 24,
    marginBottom: 28,
    gap: 16,
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  actionIcon: {
    opacity: 1,
  },
  actionButtonText: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },

  // ── Sección historial ────────────────────────────────────────────────────
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.light.tint,
    letterSpacing: 1.5,
    textAlign: "center",
    marginBottom: 14,
  },

  // ── Tarjeta de viaje ─────────────────────────────────────────────────────
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
  tripRoute: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  tripRouteRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  tripRouteLabel: {
    fontSize: 11,
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
  tripDateText: {
    fontSize: 12,
    color: "#555",
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

  // ── Botón Ver Más ────────────────────────────────────────────────────────
  verMasButton: {
    backgroundColor: Colors.light.tint,
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 48,
    alignSelf: "center",
    marginTop: 8,
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  verMasText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  activeTripContainer: {
    marginBottom: 20,
  },
  actionButtonDisabled: {
    backgroundColor: "#7E8494",
    shadowColor: "transparent",
    shadowOpacity: 0,
    elevation: 0,
  },
  actionIconDisabled: {
    opacity: 0.65,
  },
  actionButtonTextDisabled: {
    color: "#E0E0E0",
  },
});
