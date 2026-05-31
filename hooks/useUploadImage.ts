import type { PickedImage } from "@/components/ui/profile-picker";
import { supabase } from "@/utils/supabase";
import { useCallback, useState } from "react";

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
  userAuthId?: string;
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
  uploadImage: (
    image: PickedImage,
    options?: UploadOptions,
  ) => Promise<string | null>;
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
  const extension = originalName.split(".").pop() ?? "jpg";
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}_${random}.${extension}`;
}

/**
 * Decodifica una cadena en base64 y la convierte en un ArrayBuffer para la subida de archivos en React Native.
 * @param base64 - Cadena en formato base64.
 */
function decodeBase64(base64: string): ArrayBuffer {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }

  let bufferLength = base64.length * 0.75;
  if (base64[base64.length - 1] === "=") {
    bufferLength--;
    if (base64[base64.length - 2] === "=") {
      bufferLength--;
    }
  }

  const arrayBuffer = new ArrayBuffer(bufferLength);
  const bytes = new Uint8Array(arrayBuffer);

  let p = 0;
  for (let i = 0; i < base64.length; i += 4) {
    const base640 = lookup[base64.charCodeAt(i)];
    const base641 = lookup[base64.charCodeAt(i + 1)];
    const base642 = lookup[base64.charCodeAt(i + 2)];
    const base643 = lookup[base64.charCodeAt(i + 3)];

    bytes[p++] = (base640 << 2) | (base641 >> 4);
    if (p < bufferLength) {
      bytes[p++] = ((base641 & 15) << 4) | (base642 >> 2);
    }
    if (p < bufferLength) {
      bytes[p++] = ((base642 & 3) << 6) | (base643 & 63);
    }
  }
  return arrayBuffer;
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
        bucket = "fotosPerfil",
        uniqueFileName = false,
        userAuthId,
        upsert = true,
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

        let folderPath = userAuthId;

        // Si no se proporciona userAuthId, intentamos obtenerlo de la sesión activa
        // para garantizar que cumple con la política RLS del bucket
        if (!folderPath) {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.user) {
            folderPath = session.user.id;
          }
        }

        // Construir la ruta completa dentro del bucket
        const storagePath = folderPath ? `${folderPath}/${fileName}` : fileName;

        // ── 2. Preparar el archivo (ArrayBuffer o Blob para React Native) ──
        console.log("=== REVISANDO RUTA DE SUBIDA ===");
        console.log("Bucket:", bucket);
        console.log("Ruta construida (storagePath):", storagePath);

        let uploadData: ArrayBuffer | Blob;

        if (image.base64) {
          console.log("[useUploadImage] Usando representación en base64 de la imagen...");
          uploadData = decodeBase64(image.base64);
        } else {
          console.log("[useUploadImage] Base64 no disponible, usando puente XHR como fallback...");
          uploadData = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = function () {
              resolve(xhr.response as Blob);
            };
            xhr.onerror = function (e) {
              console.error("[useUploadImage] Error en XHR Puente:", e);
              reject(new TypeError("Network request failed"));
            };
            xhr.responseType = "blob";
            xhr.open("GET", image.uri, true);
            xhr.send(null);
          });
        }

        // ── 3. Subir al bucket de Supabase Storage ──
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(storagePath, uploadData, {
            contentType: image.mimeType ?? "image/jpeg",
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
          throw new Error("No se pudo obtener la URL pública de la imagen.");
        }

        setPublicUrl(data.publicUrl);
        return data.publicUrl;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Error desconocido al subir la imagen.";
        console.error("[useUploadImage] Error al subir imagen:", message);
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
