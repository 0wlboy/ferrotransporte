import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {PetitionCardSmall} from '@/components/ui/petition-card'
import { router } from 'expo-router';
import React from 'react';
import {
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';


// ─────────────────────────────────────────────────────────────────────────────
// DATOS DE RELLENO (se reemplazará con datos reales de la tabla peticiones)
// ─────────────────────────────────────────────────────────────────────────────

const PLACEHOLDER_TRIPS: TripRecord[] = [
    {
        id: '1',
        conductorNombre: 'Carlos Javier',
        origen: 'Calidad',
        destino: 'Gerencia',
        fecha: '12/01/2026',
        hora: '1:00 pm',
        estado: 'Completado',
    },
    {
        id: '2',
        conductorNombre: 'Carlos Javier',
        origen: 'Calidad',
        destino: 'Gerencia',
        fecha: '12/01/2026',
        hora: '1:00 pm',
        estado: 'Cancelado',
    },
    {
        id: '3',
        conductorNombre: 'María González',
        origen: 'Administración',
        destino: 'Taller',
        fecha: '10/01/2026',
        hora: '9:30 am',
        estado: 'Completado',
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────


/**
 * Devuelve el saludo según la hora del día.
 */
function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
}

/**
 * Determina el texto y la ruta del botón principal según el rol del usuario.
 */
function getActionButton(role: string | null): { label: string; icon: string; route: string } {
    switch (role) {
        case 'Conductor':
            return { label: 'Ver Mis Viajes', icon: 'steering', route: '/(auth)/(tabs)/viajes' };
        case 'Administrador':
        case 'Admin':
            return { label: 'Gestionar Peticiones', icon: 'clipboard-list', route: '/(auth)/(tabs)/admin' };
        case 'Pasajero':
        default:
            return { label: 'Pedir Vehículo', icon: 'van-utility', route: '/(auth)/(tabs)/solicitar' };
    }
}


// ─────────────────────────────────────────────────────────────────────────────
// PANTALLA PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
    const { user } = useAuth();

    const greeting = getGreeting();
    const nombre = user?.nombre ?? 'Usuario';
    const { label: actionLabel, icon: actionIcon } = getActionButton(user?.role ?? null);

    // Mostrar solo los 2 más recientes en el resumen
    const recentTrips = PLACEHOLDER_TRIPS.slice(0, 2);

    return (
        <View style={styles.screen}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.light.tint} />

            {/* ── HEADER ── */}
            <View style={styles.header}>
                {/* Logo */}
                <View style={styles.logoContainer}>
                    <Image
                        source={require('@/assets/images/ferrominera-logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>

                {/* Botón de perfil */}
                <TouchableOpacity
                    style={styles.profileButton}
                    onPress={() => router.push('/(auth)/(tabs)/perfil' as any)}
                    activeOpacity={0.8}
                >
                    {user?.fotoUrl ? (
                        <Image source={{ uri: user.fotoUrl }} style={styles.profilePhoto} />
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
                <Text style={styles.subtitleText}>{greeting}, {nombre}</Text>
            </View>

            {/* ── CONTENIDO SCROLLEABLE ── */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ── BOTÓN DE ACCIÓN PRINCIPAL ── */}
                <TouchableOpacity
                    style={styles.actionButton}
                    activeOpacity={0.85}
                    onPress={() => {
                        // La navegación real se conectará cuando las rutas estén listas
                        console.log('Acción principal presionada para rol:', user?.role);
                    }}
                >
                    <MaterialCommunityIcons
                        name={actionIcon as any}
                        size={48}
                        color="#FFFFFF"
                        style={styles.actionIcon}
                    />
                    <Text style={styles.actionButtonText}>{actionLabel}</Text>
                </TouchableOpacity>

                {/* ── HISTORIAL DE VIAJES ── */}
                <Text style={styles.sectionTitle}>HISTORIAL DE VIAJES</Text>

                {recentTrips.map((trip) => (
                    <PetitionCardSmall key={trip.id} data={trip} />
                ))}

                {/* ── VER MÁS ── */}
                <TouchableOpacity
                    style={styles.verMasButton}
                    activeOpacity={0.85}
                    onPress={() => {
                        console.log('Ver más viajes');
                    }}
                >
                    <Text style={styles.verMasText}>Ver Mas</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────

const CRIMSON = Colors.light.tint;
const BG = Colors.light.background;

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: BG,
    },

    // ── Header ──────────────────────────────────────────────────────────────
    header: {
        backgroundColor: CRIMSON,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 48,
        paddingBottom: 12,
    },
    logoContainer: {
        width: 52,
        height: 52,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    logo: {
        width: 44,
        height: 44,
    },
    profileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
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
        backgroundColor: '#E0E0E0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileButtonText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1A1A1A',
        letterSpacing: 0.5,
    },

    // ── Título ──────────────────────────────────────────────────────────────
    titleSection: {
        backgroundColor: CRIMSON,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    titleText: {
        fontSize: 42,
        fontWeight: '900',
        color: '#FFFFFF',
        lineHeight: 48,
    },
    subtitleText: {
        fontSize: 15,
        color: '#FFFFFF',
        opacity: 0.9,
        marginTop: 2,
    },

    // ── Scroll ──────────────────────────────────────────────────────────────
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },

    // ── Botón de acción principal ────────────────────────────────────────────
    actionButton: {
        backgroundColor: CRIMSON,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 24,
        paddingHorizontal: 24,
        marginBottom: 28,
        gap: 16,
        shadowColor: CRIMSON,
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
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.2,
    },

    // ── Sección historial ────────────────────────────────────────────────────
    sectionTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: CRIMSON,
        letterSpacing: 1.5,
        textAlign: 'center',
        marginBottom: 14,
    },

    // ── Tarjeta de viaje ─────────────────────────────────────────────────────
    tripCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E8E8E8',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    tripCardTop: {
        flexDirection: 'row',
        alignItems: 'center',
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
        backgroundColor: '#EEEEEE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tripConductorInfo: {
        flex: 1,
    },
    tripConductorLabel: {
        fontSize: 11,
        color: '#888',
        marginBottom: 2,
    },
    tripConductorName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    tripRoute: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    tripRouteRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tripRouteLabel: {
        fontSize: 11,
        color: '#888',
    },
    tripRouteValue: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    tripArrowRow: {
        alignItems: 'flex-end',
        paddingRight: 2,
    },
    tripArrowIcon: {
        marginVertical: -2,
    },

    // ── Divider ──────────────────────────────────────────────────────────────
    tripDivider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 10,
    },

    // ── Fila inferior de la tarjeta ───────────────────────────────────────────
    tripCardBottom: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    tripDateText: {
        fontSize: 12,
        color: '#555',
    },
    statusBadge: {
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    statusBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },

    // ── Botón Ver Más ────────────────────────────────────────────────────────
    verMasButton: {
        backgroundColor: CRIMSON,
        borderRadius: 30,
        paddingVertical: 14,
        paddingHorizontal: 48,
        alignSelf: 'center',
        marginTop: 8,
        shadowColor: CRIMSON,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    verMasText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
});