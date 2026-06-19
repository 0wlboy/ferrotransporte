import OrdenModal, { SortDirection, SortField } from "@/components/modals/orden-modal";
import { PetitionCardBig, PetitionCardSmall, TripRecord, TripPriority } from "@/components/ui/petition-card";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/auth-context";
import { useCars } from "@/context/car-context";
import { useChangePetitionStatus } from "@/hooks/useChangePetitionStatus";
import { useGetPetition } from "@/hooks/useGetPetition";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Inbox() {
  const { user } = useAuth();
  const { car } = useCars();
  const { changePetitionStatus } = useChangePetitionStatus();

  // 1. Fetch petitions using custom useGetPetition hook
  const { petitions, isLoading, error, refetch } = useGetPetition({
    role: "Conductor",
    asignacion: "Pendiente",
  });

  // 2. Sorting State (Defaulting to 'fecha' and 'Descendente' as requested)
  const [sortField, setSortField] = useState<SortField>("fecha");
  const [sortDirection, setSortDirection] = useState<SortDirection>("Descendente");
  const [showSortModal, setShowSortModal] = useState<boolean>(false);

  // Modal State for Petition Details
  const [selectedTrip, setSelectedTrip] = useState<TripRecord | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);

  const handleAccept = async () => {
    if (!selectedTrip) return;
    if (!car) {
      Alert.alert(
        "Atención",
        "No tienes un vehículo asignado. Por favor, asigna uno en tu perfil antes de aceptar solicitudes.",
      );
      return;
    }

    try {
      await changePetitionStatus({
        petitionId: selectedTrip.id,
        status: "En Camino",
        ci_driver: (car.ci_driver || user?.ci_user) ?? undefined,
        placa_vehiculo: car.placa ?? undefined,
        driverName: user ? `${user.primer_nombre} ${user.apellido}` : undefined,
      });
      setShowModal(false);
      setSelectedTrip(null);
      refetch();
      Alert.alert(
        "Éxito",
        "Has aceptado la petición de transporte.",
        [
          {
            text: "Aceptar",
            onPress: () => {
              router.replace("/(auth)/home" as any);
            },
          },
        ]
      );
    } catch (err) {
      console.error("Error al aceptar la petición:", err);
      Alert.alert("Error", "No se pudo aceptar la petición. Intenta de nuevo.");
    }
  };

  // 3. Perform real-time client-side sorting on retrieved petitions
  const sortedPetitions = useMemo(() => {
    if (!petitions) return [];

    return [...petitions].sort((a, b) => {
      let comparison = 0;

      if (sortField === "fecha") {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        comparison = dateA - dateB;
      } else if (sortField === "pasajeros") {
        const passA = a.acompañantes || 0;
        const passB = b.acompañantes || 0;
        comparison = passA - passB;
      } else if (sortField === "estado") {
        const statusA = a.estado || "";
        const statusB = b.estado || "";
        comparison = statusA.localeCompare(statusB);
      }

      // Apply sorting direction (Ascendente or Descendente)
      return sortDirection === "Ascendente" ? comparison : -comparison;
    });
  }, [petitions, sortField, sortDirection]);

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.light.tint} />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        {/* White squared rounded Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
          accessibilityLabel="Volver al inicio"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={20}
            color={Colors.light.tint}
          />
        </TouchableOpacity>

        {/* Header Title */}
        <Text style={styles.headerTitle}>Buzon de{"\n"}Entrada</Text>
      </View>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <SafeAreaView style={styles.contentContainer} edges={["bottom", "left", "right"]}>

        {/* ── ACTIONS BAR (Sorting Activation Button) ── */}
        <View style={styles.actionsBar}>
          <TouchableOpacity
            style={styles.orderButton}
            onPress={() => setShowSortModal(true)}
            activeOpacity={0.8}
            accessibilityLabel="Abrir opciones de ordenamiento"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons
              name="sort-variant"
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.orderButtonText}>Orden</Text>
          </TouchableOpacity>
        </View>

        {/* ── PETITIONS LIST ── */}
        {isLoading && petitions.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.light.tint} />
            <Text style={styles.loadingText}>Cargando historial...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={48}
              color="#D32F2F"
            />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={refetch}
              activeOpacity={0.8}
            >
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={sortedPetitions}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={refetch}
                colors={[Colors.light.tint]}
                tintColor={Colors.light.tint}
              />
            }
            renderItem={({ item }) => {
              // Standardize date and time formats in Spanish
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

              // Map PetitionData to expected TripRecord shape for PetitionCardSmall
              const tripData: TripRecord = {
                id: item.id,
                userNombre: item.usuario?.nombre || "Por Asignar",
                userFoto: item.usuario?.foto_url || undefined,
                origen: item.origen,
                destino: item.destino,
                acompañantes: item.acompañantes || 0,
                carga: item.carga || "Sin carga",
                fecha: formattedDate,
                hora: formattedTime,
                prioridad: item.prioridad as TripPriority,
                motivo: item.carga || undefined,
                estado: item.estado as any,
                descripcion: item.descripcion || "",
              };

              return (
                <PetitionCardSmall
                  data={tripData}
                  viewerRole="Conductor"
                  onPress={() => {
                    setSelectedTrip(tripData);
                    setShowModal(true);
                  }}
                />
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="text-box-remove-outline"
                  size={64}
                  color="#B0B0B0"
                />
                <Text style={styles.emptyText}>No tienes viajes registrados</Text>
                <Text style={styles.emptySubText}>
                  Las peticiones de transporte que realices o tengas asignadas aparecerán aquí.
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>

      {/* ── SORTING CONFIGURATION MODAL ── */}
      <OrdenModal
        visible={showSortModal}
        onClose={() => setShowSortModal(false)}
        currentField={sortField}
        onSelectField={(field) => setSortField(field)}
        currentDirection={sortDirection}
        onSelectDirection={(dir) => setSortDirection(dir)}
      />

      {/* ── PETITION DETAIL MODAL ── */}
      <PetitionCardBig
        visible={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedTrip(null);
        }}
        data={selectedTrip}
        onAccept={handleAccept}
        viewerRole={user?.role as any}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.light.tint, // Solid dark red background from theme (#A4032B)
  },

  // ── Header Styles ────────────────────────────────────────────────────────
  header: {
    paddingTop: 16,
    paddingBottom: 28,
    paddingHorizontal: 24,
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

  // ── Main Content Area ───────────────────────────────────────────────────
  contentContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // ── Actions & Sorting Button ─────────────────────────────────────────────
  actionsBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 16,
  },
  orderButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.tint, // Same red color as header (#A4032B)
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  orderButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  // ── List & Empty States ──────────────────────────────────────────────────
  listContent: {
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 0.8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#666",
    fontWeight: "600",
  },
  errorText: {
    marginTop: 12,
    fontSize: 15,
    color: "#D32F2F",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#5C0614",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubText: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
  },
});
