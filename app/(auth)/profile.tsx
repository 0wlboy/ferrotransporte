import ExitModal from "@/components/modals/exit-modal";
import { useAuth } from "@/context/auth-context";
import { useCars } from "@/context/car-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Profile() {
  const { user, signOut, isLoading } = useAuth();
  const { car } = useCars();

  // Estado de visibilidad del modal de confirmación de cierre de sesión
  const [showExitModal, setShowExitModal] = useState(false);

  // Mapear campos con fallbacks por si acaso el usuario no tiene los datos cargados aún
  const primer_nombre = user?.primer_nombre || "Carlos";
  const apellido = user?.apellido || "Narvaez";
  const telefono = user?.telf || "+58 4129807";
  const ci = user?.ci_user || "V-20203456";
  const gerencia = user?.gerencia || "Gerencias";
  const email = user?.email || "carlos@javier123.com";
  const fotoUrl = user?.foto_url || null;

  /** Abre el modal de confirmación (no cierra sesión de inmediato) */
  const handleLogoutPress = () => {
    setShowExitModal(true);
  };

  /** Cierra sesión al confirmar en el modal */
  const handleLogoutConfirm = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("[Profile] Error al cerrar sesión:", error);
    } finally {
      setShowExitModal(false);
    }
  };

  /** Cancela el modal sin cerrar sesión */
  const handleLogoutCancel = () => {
    setShowExitModal(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#A10F2D" />

      {/* ── ENCABEZADO CARMESÍ ── */}
      <View style={styles.header}>
        {/* Botón de Atrás */}
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.8}
          style={styles.backButton}
          accessibilityLabel="Volver"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color="#A10F2D" />
        </TouchableOpacity>

        {/* Título */}
        <Text style={styles.headerTitle}>Perfil de Usuario</Text>
        {user?.role === "Conductor" && (
          <TouchableOpacity
            onPress={() => router.push("/edit-car")}
            activeOpacity={0.8}
            style={styles.carProfileButton}
            accessibilityLabel="Perfil del vehículo"
            accessibilityRole="button"
          >
            {car?.foto_url ? (
              <Image source={{ uri: car.foto_url }} style={styles.carPhoto} />
            ) : (
              <View style={styles.carPhotoPlaceholder}>
                <MaterialCommunityIcons name="account" size={22} color="#888" />
              </View>
            )}
            <Text>Vehiculo</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── CUERPO CON TARJETA DESLIZABLE ── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* Fila superior de la tarjeta: Botón Editar y Foto Centrada */}
        <View style={styles.cardHeader}>
          {/* Avatar de Perfil */}
          <View style={styles.avatarContainer}>
            {fotoUrl ? (
              <Image
                source={{ uri: fotoUrl }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <MaterialCommunityIcons
                name="account"
                size={64}
                color="#A10F2D"
              />
            )}
          </View>

          {/* Botón Editar Perfil (Esquina Superior Derecha de la tarjeta) */}
          <TouchableOpacity
            style={styles.editButton}
            activeOpacity={0.85}
            onPress={() => router.push("/edit-profile")}
            accessibilityLabel="Editar Perfil"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons
              name="pencil-outline"
              size={16}
              color="#FFFFFF"
            />
            <Text style={styles.editButtonText}>Editar Perfil</Text>
          </TouchableOpacity>
        </View>

        {/* ── CAMPOS DE DETALLE (NO INTERACTIVOS) ── */}

        {/* Fila: Nombre | Apellido */}
        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.fieldLabel}>Nombre</Text>
            <View style={styles.readOnlyBox}>
              <Text style={styles.readOnlyText} numberOfLines={1}>
                {primer_nombre}
              </Text>
            </View>
          </View>

          <View style={styles.halfField}>
            <Text style={styles.fieldLabel}>Apellido</Text>
            <View style={styles.readOnlyBox}>
              <Text style={styles.readOnlyText} numberOfLines={1}>
                {apellido}
              </Text>
            </View>
          </View>
        </View>

        {/* Fila: Teléfono | CI */}
        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.fieldLabel}>Telefono</Text>
            <View style={styles.readOnlyBox}>
              <Text style={styles.readOnlyText} numberOfLines={1}>
                {telefono}
              </Text>
            </View>
          </View>

          <View style={styles.halfField}>
            <Text style={styles.fieldLabel}>CI</Text>
            <View style={styles.readOnlyBox}>
              <Text style={styles.readOnlyText} numberOfLines={1}>
                {ci}
              </Text>
            </View>
          </View>
        </View>

        {/* Gerencia o Departamento */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Gerencia o Departamento</Text>
          <View style={styles.readOnlyBox}>
            <Text style={styles.readOnlyText} numberOfLines={1}>
              {gerencia}
            </Text>
          </View>
        </View>

        {/* Correo */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Correo</Text>
          <View style={styles.readOnlyBox}>
            <Text style={styles.readOnlyText} numberOfLines={1}>
              {email}
            </Text>
          </View>
        </View>

        {/* ── BOTÓN CERRAR SESIÓN ── */}
        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.8}
          onPress={handleLogoutPress}
          accessibilityLabel="Cerrar Sesión"
          accessibilityRole="button"
        >
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── MODAL DE CONFIRMACIÓN ── */}
      <ExitModal
        visible={showExitModal}
        onCancel={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
        loading={isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#A10F2D",
  },
  header: {
    backgroundColor: "#A10F2D",
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  carProfileButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 24,
  },
  carPhoto: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  carPhotoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -20,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    position: "relative",
    marginBottom: 28,
  },
  avatarContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1.5,
    borderColor: "#F5D6DB",
    backgroundColor: "#FFF5F6",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  editButton: {
    position: "absolute",
    right: 0,
    top: 0,
    backgroundColor: "#A10F2D",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  halfField: {
    flex: 1,
  },
  fieldContainer: {
    marginBottom: 16,
    width: "100%",
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4A4A4A",
    marginBottom: 6,
  },
  readOnlyBox: {
    height: 52,
    backgroundColor: "#F5F5F7",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F0F0F2",
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  readOnlyText: {
    fontSize: 15,
    color: "#2E2E2E",
    fontWeight: "500",
  },
  logoutButton: {
    alignSelf: "center",
    width: "60%",
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#A10F2D",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28,
  },
  logoutButtonText: {
    color: "#A10F2D",
    fontSize: 16,
    fontWeight: "600",
  },
});
