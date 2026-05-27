import type { PickedImage } from '@/components/ui/profile-picker';
import { supabase } from '@/utils/supabase';
import { useCallback, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Opciones para personalizar el comportamiento de la subida.
 */
export interface UploadOptions {
    /**
     * Nombre del bucket de Supabase Storage donde se subirá la imagen.
     * El bucket debe existir y tener las políticas de acceso configuradas.
     * @default 'images'
     */
    bucket?: string;
    /**
     * Carpeta dentro del bucket donde se guardará el archivo.
     * @example 'avatars' → sube a `<bucket>/avatars/<filename>`
     */
    folder?: string;
    /**
     * Si es `true`, genera un nombre de archivo único usando un UUID
     * para evitar colisiones. Si es `false`, usa el nombre original.
     * @default true
     */
    uniqueFileName?: boolean;
    /**
     * Si es `true`, reemplaza el archivo si ya existe en el mismo path.
     * @default false
     */
    upsert?: boolean;
}

/**
 * Valor de retorno del hook `useUploadImage`.
 */
export interface UseUploadImageReturn {
    /**
     * Sube una imagen al bucket de Supabase Storage.
     * @param image - Imagen procesada por `ProfilePicker` u otro selector.
     * @param options - Opciones opcionales de subida (bucket, folder, etc.).
     * @returns La URL pública de la imagen subida, o `null` si hubo un error.
     */
    uploadImage: (image: PickedImage, options?: UploadOptions) => Promise<string | null>;
    /** `true` mientras la imagen se está subiendo. */
    uploading: boolean;
    /** Mensaje de error si la subida falla, o `null` si todo está bien. */
    error: string | null;
    /** URL pública de la última imagen subida con éxito. */
    publicUrl: string | null;
    /** Resetea el estado del hook (error, publicUrl) a sus valores iniciales. */
    reset: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILIDADES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Genera un nombre de archivo único basado en timestamp y sufijo aleatorio.
 * @param originalName - Nombre original del archivo (usado para preservar la extensión).
 */
function generateUniqueFileName(originalName: string): string {
    const extension = originalName.split('.').pop() ?? 'jpg';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}_${random}.${extension}`;
}

/**
 * Convierte la URI local de una imagen en un `Blob` para subirla a Supabase.
 * Funciona tanto en React Native (fetch nativo) como en web.
 */
async function uriToBlob(uri: string): Promise<Blob> {
    const response = await fetch(uri);
    return await response.blob();
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `useUploadImage` — Hook para subir imágenes a Supabase Storage.
 *
 * Gestiona el ciclo completo de subida: conversión de URI local → Blob →
 * upload a Storage → obtención de la URL pública.
 *
 * Características:
 * - Compatible con imágenes seleccionadas por `ProfilePicker` (`PickedImage`).
 * - Maneja estados de carga y error de forma reactiva.
 * - Genera nombres únicos para evitar colisiones en el bucket.
 * - Devuelve la URL pública directamente lista para guardar en la base de datos.
 *
 * Uso básico:
 * ```tsx
 * const { uploadImage, uploading, error, publicUrl } = useUploadImage();
 *
 * const handleSave = async () => {
 *   const url = await uploadImage(pickedImage, {
 *     bucket: 'avatars',
 *     folder: 'profiles',
 *   });
 *   if (url) {
 *     await saveUserProfile({ avatarUrl: url });
 *   }
 * };
 * ```
 *
 * Requisitos en Supabase:
 * - El bucket debe existir (ej: `avatars`).
 * - Las políticas RLS del bucket deben permitir INSERT al usuario autenticado.
 * - El bucket debe ser público o tener políticas de SELECT configuradas.
 */
export function useUploadImage(): UseUploadImageReturn {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [publicUrl, setPublicUrl] = useState<string | null>(null);

    // ───────────────────────────────────────────────────────────────────────
    // RESET
    // ───────────────────────────────────────────────────────────────────────

    /** Limpia el error y la URL pública, dejando el hook listo para un nuevo intento. */
    const reset = useCallback(() => {
        setError(null);
        setPublicUrl(null);
    }, []);

    // ───────────────────────────────────────────────────────────────────────
    // UPLOAD
    // ───────────────────────────────────────────────────────────────────────

    const uploadImage = useCallback(
        async (
            image: PickedImage,
            options: UploadOptions = {},
        ): Promise<string | null> => {
            const {
                bucket = 'fotosPerfil',
                folder,
                uniqueFileName = true,
                upsert = false,
            } = options;

            setUploading(true);
            setError(null);
            setPublicUrl(null);

            try {
                // ── 1. Determinar el nombre final del archivo ──
                const rawName = image.fileName || `image_${Date.now()}.jpg`;
                const fileName = uniqueFileName
                    ? generateUniqueFileName(rawName)
                    : rawName;

                // Construir la ruta completa dentro del bucket
                const storagePath = folder ? `${folder}/${fileName}` : fileName;

                // ── 2. Convertir URI local a Blob ──
                const blob = await uriToBlob(image.uri);

                // ── 3. Subir al bucket de Supabase Storage ──
                const { error: uploadError } = await supabase.storage
                    .from(bucket)
                    .upload(storagePath, blob, {
                        contentType: image.mimeType ?? 'image/jpeg',
                        upsert,
                    });

                if (uploadError) {
                    throw new Error(uploadError.message);
                }

                // ── 4. Obtener la URL pública del archivo subido ──
                const { data } = supabase.storage
                    .from(bucket)
                    .getPublicUrl(storagePath);

                if (!data?.publicUrl) {
                    throw new Error('No se pudo obtener la URL pública de la imagen.');
                }

                setPublicUrl(data.publicUrl);
                return data.publicUrl;
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : 'Error desconocido al subir la imagen.';
                setError(message);
                return null;
            } finally {
                setUploading(false);
            }
        },
        [],
    );

    return { uploadImage, uploading, error, publicUrl, reset };
}
