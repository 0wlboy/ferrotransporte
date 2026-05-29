import { Colors } from '@/constants/theme';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import {
    Image,
    StyleSheet,
    Text,
    View
} from 'react-native';

interface TripRecord {
    id: string;
    conductorNombre: string;
    conductorFoto?: string;
    origen: string;
    destino: string;
    fecha: string;
    hora: string;
    estado: TripStatus;
}

type TripStatus = 'Completado' | 'Cancelado' | 'En Camino' | 'Pendiente';

function getStatusColor(estado: TripStatus): string {
    switch (estado) {
        case 'Completado': return '#2E7D32';
        case 'Cancelado': return '#C62828';
        case 'En Camino': return '#1565C0';
        case 'Pendiente': return '#E65100';
        default: return '#757575';
    }
}

export function PetitionCardSmall({ data }: { data: TripRecord }) {
    const statusColor = getStatusColor(data.estado);
    return (<>
        <View style={styles.tripCard}>
            {/* Fila superior: foto + nombre + origen/destino */}
            <View style={styles.tripCardTop}>
                {/* Avatar del conductor */}
                <View style={styles.avatarContainer}>
                    {data.conductorFoto ? (
                        <Image source={{ uri: data.conductorFoto }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <MaterialCommunityIcons name="account" size={28} color="#888" />
                        </View>
                    )}
                </View>

                {/* Nombre del conductor */}
                <View style={styles.tripConductorInfo}>
                    <Text style={styles.tripConductorLabel}>Conductor</Text>
                    <Text style={styles.tripConductorName}>{data.conductorNombre}</Text>
                </View>

                {/* Origen → Destino */}
                <View style={styles.tripRoute}>
                    <View style={styles.tripRouteRow}>
                        <Text style={styles.tripRouteLabel}>Origen  </Text>
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

            {/* Fila inferior: fecha + estado */}
            <View style={styles.tripCardBottom}>
                <Text style={styles.tripDateText}>
                    Fecha: {data.fecha}{'  '}{data.hora}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                    <Text style={styles.statusBadgeText}>{data.estado}</Text>
                </View>
            </View>
        </View>
    </>)

}

export function PetitionCardBig() {

}


const styles = StyleSheet.create({
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
})
