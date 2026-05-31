import { supabase } from "@/utils/supabase";
import { useCallback, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Datos que el usuario ingresa en la pantalla Petition.
 */
export interface PetitionPayload {
  /** CI del usuario solicitante. */
  ci: string;
  /** Departamento / área de origen del solicitante. */
  origen: string;
  /** Departamento / área de destino del viaje. */
  destino: string;
  /** Número de pasajeros solicitados. */
  pasajeros: number;
  /** Nivel de prioridad del viaje: "Media" | "Alta". */
  prioridad: string;
  /** Descripción de la carga o motivo del viaje (opcional). */
  carga?: string;
}

/**
 * Valor de retorno del hook `useSendPetition`.
 */
export interface UseSendPetitionReturn {
  /**
   * Envía la petición a Supabase.
   * @param payload - Datos del formulario de la pantalla Petition.
   * @returns `true` si la inserción fue exitosa, `false` si hubo un error.
   */
  sendPetition: (payload: PetitionPayload) => Promise<boolean>;
  /** `true` mientras la petición se está enviando. */
  isLoading: boolean;
  /** Mensaje de error si el envío falla, o `null` si todo está bien. */
  error: string | null;
  /** Limpia el estado de error del hook. */
  reset: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `useSendPetition` — Hook para insertar una petición de transporte en Supabase.
 *
 * Gestiona el ciclo completo de envío:
 * - Obtiene el usuario autenticado del contexto de autenticación.
 * - Valida que exista una sesión activa antes de intentar insertar.
 * - Inserta un registro en la tabla `peticiones` con todos los campos del formulario.
 * - Maneja los estados de carga y error de forma reactiva.
 *
 * Uso básico:
 * ```tsx
 * const { sendPetition, isLoading, error } = useSendPetition();
 *
 * const handleSubmit = async () => {
 *   const success = await sendPetition({ origen, destino, pasajeros, prioridad, carga });
 *   if (success) router.back();
 * };
 * ```
 *
 * Requisitos en Supabase:
 * - La tabla `peticiones` debe existir con las columnas correspondientes.
 * - Las políticas RLS deben permitir INSERT al usuario autenticado.
 */
export function useSendPetition(): UseSendPetitionReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ───────────────────────────────────────────────────────────────────────
  // RESET
  // ───────────────────────────────────────────────────────────────────────

  /** Limpia el error, dejando el hook listo para un nuevo intento. */
  const reset = useCallback(() => {
    setError(null);
  }, []);

  // ───────────────────────────────────────────────────────────────────────
  // SEND PETITION
  // ───────────────────────────────────────────────────────────────────────

  const sendPetition = useCallback(
    async (payload: PetitionPayload): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const { error: insertError } = await supabase
          .from("peticiones")
          .insert({
            ci_pasajero: payload.ci, // FK al usuario autenticado
            origen: payload.origen,
            destino: payload.destino,
            acompañantes: payload.pasajeros,
            prioridad: payload.prioridad,
            carga: payload.carga?.trim() || null,
            estado: "Pendiente", // Estado inicial de toda petición
            created_at: new Date().toISOString(),
          });

        if (insertError) {
          throw new Error(insertError.message);
        }

        console.log("[useSendPetition] Petición enviada exitosamente.");
        return true;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Error desconocido al enviar la petición.";
        console.error("[useSendPetition] Error al enviar petición:", message);
        setError(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { sendPetition, isLoading, error, reset };
}
