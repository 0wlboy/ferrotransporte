import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
    type StyleProp,
    type ViewStyle,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resultado procesado de una imagen seleccionada por el usuario.
 */
export interface PickedImage {
    /** URI local del archivo en el dispositivo */
    uri: string;
    /** Tipo MIME de la imagen (ej: 'image/jpeg') */
    mimeType: string | undefined;
    /** Nombre de archivo inferido de la URI */
    fileName: string;
    /** Tamaño del archivo en bytes */
    fileSize: number | undefined;
    /** Ancho en píxeles */
    width: number;
    /** Alto en píxeles */
    height: number;
}

/**
 * Props del componente ProfilePicker.
 */
export interface ProfilePickerProps {
    /**
     * Callback invocado cuando el usuario selecciona o cambia una foto.
     * Recibe el objeto `PickedImage` procesado, listo para ser enviado a un backend.
     * Si el usuario cancela, no se invoca.
     */
    onImageSelected: (image: PickedImage) => void;
    /** Mensaje de error a mostrar debajo del picker (ej: campo requerido) */
    error?: string;
    /** Estilos opcionales para el contenedor externo */
    containerStyle?: StyleProp<ViewStyle>;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ProfilePicker — Selector y previsualizador de foto de perfil.
 *
 * Características:
 * - Círculo interactivo con ícono de persona por defecto.
 * - Al tocar, abre la galería del dispositivo (solicita permisos si es necesario).
 * - Muestra la imagen seleccionada dentro del círculo en tiempo real.
 * - Procesa y normaliza los metadatos de la imagen para entregarlos listos al backend.
 * - Muestra un error rojo debajo si el campo es requerido y no se ha seleccionado imagen.
 * - El borde del círculo cambia a rojo si hay error, reforzando el feedback visual.
 *
 * Uso:
 * ```tsx
 * <ProfilePicker
 *   onImageSelected={(img) => setProfileImage(img)}
 *   error={profileError}
 * />
 * ```
 */
export function ProfilePicker({
    onImageSelected,
    error,
    containerStyle,
}: ProfilePickerProps) {
    /** URI local de la imagen seleccionada para previsualización */
    const [imageUri, setImageUri] = useState<string | null>(null);

    const hasError = !!error;

    // ───────────────────────────────────────────────────────────────────────
    // MANEJADOR: Abrir galería y seleccionar imagen
    // ───────────────────────────────────────────────────────────────────────

    /**
     * Solicita permisos de galería y abre el selector de imágenes del sistema.
     * Si el usuario selecciona una imagen, la procesa y notifica al padre via callback.
     */
    const handlePickImage = async () => {
        // Solicitar permiso de acceso a la galería del dispositivo
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            // El permiso fue denegado — no podemos continuar
            // En producción se podría mostrar un Alert explicativo
            return;
        }

        // Abrir el selector de imágenes del sistema operativo
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],         // Solo imágenes (no videos)
            allowsEditing: true,            // Permite recorte antes de confirmar
            aspect: [1, 1],                 // Forzar recorte cuadrado para foto de perfil
            quality: 0.85,                  // Calidad 85% para balance tamaño/calidad
            allowsMultipleSelection: false, // Solo una imagen a la vez
        });

        // El usuario canceló — no hacer nada
        if (result.canceled) return;

        const asset = result.assets[0];

        // ── Procesar y normalizar los metadatos de la imagen ──
        // Este objeto está listo para ser enviado a un backend (Supabase Storage, S3, etc.)
        // cuando se disponga de un destino.
        const processedImage: PickedImage = {
            uri: asset.uri,
            mimeType: asset.mimeType ?? 'image/jpeg',
            // Inferir nombre de archivo desde la URI o generar uno único
            fileName: asset.fileName ?? `profile_${Date.now()}.jpg`,
            fileSize: asset.fileSize,
            width: asset.width,
            height: asset.height,
        };

        // Actualizar la previsualización local
        setImageUri(asset.uri);

        // Notificar al componente padre con la imagen procesada
        onImageSelected(processedImage);
    };

    // ───────────────────────────────────────────────────────────────────────
    // RENDER
    // ───────────────────────────────────────────────────────────────────────

    return (
        <View style={[styles.container, containerStyle]}>
            {/* Círculo tocable — muestra imagen o ícono por defecto */}
            <TouchableOpacity
                onPress={handlePickImage}
                activeOpacity={0.75}
                accessibilityLabel="Seleccionar foto de perfil"
                accessibilityRole="imagebutton"
                style={[
                    styles.circle,
                    hasError && styles.circleError,
                ]}
            >
                {imageUri ? (
                    // ── Previsualización de la imagen seleccionada ──
                    <Image
                        source={{ uri: imageUri }}
                        style={styles.previewImage}
                        resizeMode="cover"
                    />
                ) : (
                    // ── Estado vacío: ícono de persona ──
                    <MaterialCommunityIcons
                        name="account"
                        size={52}
                        color={hasError ? '#D32F2F' : '#A10F2D'}
                    />
                )}
            </TouchableOpacity>

            {/* Etiqueta informativa */}
            <Text style={[styles.label, hasError && styles.labelError]}>
                {imageUri ? 'Cambiar Foto de Perfil' : 'Añade una Foto de Perfil'}
            </Text>

            {/* Mensaje de error (solo visible cuando hay error) */}
            {hasError && (
                <Text style={styles.errorText}>{error}</Text>
            )}
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginBottom: 20,
    },
    circle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 1.5,
        borderColor: '#A10F2D',
        backgroundColor: '#FFF5F6',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        marginBottom: 8,
    },
    circleError: {
        borderColor: '#D32F2F',
        borderWidth: 2,
        backgroundColor: '#FFF0F0',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    label: {
        fontSize: 13,
        color: '#4A4A4A',
        fontWeight: '500',
    },
    labelError: {
        color: '#D32F2F',
    },
    errorText: {
        color: '#D32F2F',
        fontSize: 12,
        fontWeight: '500',
        marginTop: 4,
    },
});
