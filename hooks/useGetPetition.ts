import { supabase } from "@/utils/supabase";
import { useCallback, useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Standardized data structure returned by the hook for each petition entry.
 */
export interface PetitionData {
  /** Unique ID of the petition. */
  id: string;
  /** Passenger / Requester ID (e.g. CI or UUID). */
  passenger_id: string;
  /** Assigned driver / conductor ID (if any). */
  driver_id: string | null;
  /** Origin location name or text. */
  origen: string;
  /** Destination location name or text. */
  destino: string;
  /** Number of passengers requested. */
  acompañantes: number;
  /** Priority level: "Mediana" | "Alta" | etc. */
  prioridad: string;
  /** Description of cargo or trip motivation (optional). */
  carga?: string | null;
  /** Status of the petition: "Pendiente" | "En Camino" | "Completado" | "Cancelado" | etc. */
  estado: string;
  /** ISO Date of creation. */
  created_at: string;
  
  /** Passenger user profile details (joined). */
  usuario?: {
    /** Combined first and last name. */
    nombre: string;
    /** Profile picture URL. */
    foto_url: string | null;
  } | null;

  /** Location details (joined). */
  localizacion?: {
    /** Name of the location. */
    nombre: string;
  } | null;

  /** Assigned vehicle details (joined, if any). */
  vehiculo?: {
    /** Vehicle image URL. */
    foto_url: string | null;
    /** Model name of the vehicle. */
    modelo: string;
  } | null;
}

/**
 * Options for configuring the hook's filters and behavior.
 */
export interface UseGetPetitionOptions {
  /** User ID to filter by. Can be the logged-in user's ID or CI. */
  userId?: string;
  /** Role of the active user: "Pasajero" | "Conductor" (case-insensitive). */
  role?: "Pasajero" | "Conductor" | string;
  /** If true, filters out any petitions with state equal to 'por asignacion'. Default is true. */
  excludePorAsignacion?: boolean;
}

/**
 * Return type of the `useGetPetition` hook.
 */
export interface UseGetPetitionReturn {
  /** Array of enriched petition entries. */
  petitions: PetitionData[];
  /** Flag indicating if the database operation is currently active. */
  isLoading: boolean;
  /** Error message if query fails, or null if successful. */
  error: string | null;
  /** Trigger a manual reload of the data. */
  refetch: () => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMA CONFIGURATIONS
// ─────────────────────────────────────────────────────────────────────────────

interface SchemaConfig {
  select: string;
  passengerCol: string;
  driverCol: string;
}

// Option A: English schema names
const schemaA: SchemaConfig = {
  select: `
    *,
    usuario:usuarios!passenger_id (
      primer_nombre,
      apellido,
      foto_url
    ),
    localizacion:localizaciones!localizacion_id (
      nombre
    ),
    vehiculo:vehiculos!vehiculo_id (
      foto_url,
      imagen_url,
      modelo
    )
  `,
  passengerCol: "passenger_id",
  driverCol: "driver_id",
};

// Option B: Spanish / hybrid schema names (as used in useSendPetition.tsx)
const schemaB: SchemaConfig = {
  select: `
    *,
    usuario:usuarios!ci_pasajero (
      primer_nombre,
      apellido,
      foto_url
    ),
    localizacion:localizaciones!id_localizacion (
      nombre
    ),
    vehiculo:vehiculos!id_vehiculo (
      foto_url,
      imagen_url,
      modelo
    )
  `,
  passengerCol: "ci_pasajero",
  driverCol: "ci_conductor",
};

// Option C: Generic fallback joins (relying on Supabase default foreign key matching)
const schemaC: SchemaConfig = {
  select: `
    *,
    usuario:usuarios (
      primer_nombre,
      apellido,
      foto_url
    ),
    localizacion:localizaciones (
      nombre
    ),
    vehiculo:vehiculos (
      foto_url,
      imagen_url,
      modelo
    )
  `,
  passengerCol: "ci_pasajero",
  driverCol: "ci_conductor",
};

const SCHEMAS = [schemaA, schemaB, schemaC];

// ─────────────────────────────────────────────────────────────────────────────
// HOOK IMPLEMENTATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `useGetPetition` — Custom Hook to fetch transportation petitions with joins and filters.
 *
 * Joins tables:
 * - `usuarios` (to retrieve first name, last name, and profile photo)
 * - `localizaciones` (to retrieve the location's name)
 * - `vehiculos` (to retrieve vehicle model and image)
 *
 * Supports:
 * - Loading and error status management.
 * - Dynamic filtering by Passenger or Driver based on user's role.
 * - Exclusion of petitions with state "por asignacion".
 * - Manual `refetch` for pull-to-refresh implementations.
 *
 * @param options - Configuration options for filtering and behavior.
 */
export function useGetPetition(options: UseGetPetitionOptions = {}): UseGetPetitionReturn {
  const { userId, role, excludePorAsignacion = true } = options;

  const [petitions, setPetitions] = useState<PetitionData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Keep track of the schema that worked successfully to prevent retrying on every refresh
  const [detectedSchemaIdx, setDetectedSchemaIdx] = useState<number | null>(null);

  const fetchPetitions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // List of schemas to try. If one is already detected, try that one first.
    const schemasToTry = detectedSchemaIdx !== null 
      ? [SCHEMAS[detectedSchemaIdx], ...SCHEMAS.filter((_, idx) => idx !== detectedSchemaIdx)]
      : SCHEMAS;

    let success = false;
    let lastErrorMessage = "Error desconocido.";

    for (let i = 0; i < schemasToTry.length; i++) {
      const currentSchema = schemasToTry[i];
      try {
        let query = supabase.from("peticiones").select(currentSchema.select);

        // 1. Exclude status 'por asignacion' if requested
        if (excludePorAsignacion) {
          query = query.neq("estado", "por asignacion");
        }

        // 2. Apply dynamic role filtering if userId & role are provided
        if (userId && role) {
          const isConductor = role.toLowerCase() === "conductor";
          const filterCol = isConductor ? currentSchema.driverCol : currentSchema.passengerCol;
          query = query.eq(filterCol, userId);
        }

        // Execute query
        const { data, error: queryError } = await query.order("created_at", { ascending: false });

        if (queryError) {
          // If this is a schema column mismatch error, we continue to the next option
          lastErrorMessage = queryError.message;
          console.warn(`[useGetPetition] Schema option failed: ${queryError.message}`);
          continue; 
        }

        if (data) {
          // Map and standardize data
          const formattedData: PetitionData[] = data.map((item: any) => {
            // Concatenate names for user
            let userName = "";
            let userPhoto: string | null = null;
            
            if (item.usuario) {
              const u = Array.isArray(item.usuario) ? item.usuario[0] : item.usuario;
              if (u) {
                const firstName = u.primer_nombre || "";
                const lastName = u.apellido || "";
                userName = `${firstName} ${lastName}`.trim() || "Usuario";
                userPhoto = u.foto_url || null;
              }
            }

            // Extract location name
            let locName = item.origen || ""; // fallback to raw origin column
            if (item.localizacion) {
              const l = Array.isArray(item.localizacion) ? item.localizacion[0] : item.localizacion;
              if (l?.nombre) {
                locName = l.nombre;
              }
            }

            // Extract vehicle details
            let vehiclePhoto: string | null = null;
            let vehicleModel = "";
            if (item.vehiculo) {
              const v = Array.isArray(item.vehiculo) ? item.vehiculo[0] : item.vehiculo;
              if (v) {
                vehiclePhoto = v.foto_url || v.imagen_url || null;
                vehicleModel = v.modelo || "";
              }
            }

            return {
              id: item.id?.toString() || "",
              passenger_id: (item.passenger_id || item.ci_pasajero || "").toString(),
              driver_id: (item.driver_id || item.ci_conductor || null)?.toString() ?? null,
              origen: locName,
              destino: item.destino || "",
              acompañantes: Number(item.acompañantes || item.pasajeros || 1),
              prioridad: item.prioridad || "Mediana",
              carga: item.carga || null,
              estado: item.estado || "Pendiente",
              created_at: item.created_at || new Date().toISOString(),
              usuario: userName ? { nombre: userName, foto_url: userPhoto } : null,
              localizacion: locName ? { nombre: locName } : null,
              vehiculo: vehicleModel ? { foto_url: vehiclePhoto, modelo: vehicleModel } : null,
            };
          });

          // Store successful index for next time
          const originalIdx = SCHEMAS.indexOf(currentSchema);
          if (originalIdx !== -1) {
            setDetectedSchemaIdx(originalIdx);
          }

          setPetitions(formattedData);
          success = true;
          break; // Schema succeeded, stop trying others!
        }
      } catch (err) {
        lastErrorMessage = err instanceof Error ? err.message : "Excepción desconocida.";
        console.error("[useGetPetition] Error executing query:", err);
      }
    }

    if (!success) {
      setError(`No se pudieron cargar las peticiones: ${lastErrorMessage}`);
      setPetitions([]);
    }

    setIsLoading(false);
  }, [userId, role, excludePorAsignacion, detectedSchemaIdx]);

  // Fetch data on mount and whenever options change
  useEffect(() => {
    fetchPetitions();
  }, [userId, role, excludePorAsignacion]);

  return {
    petitions,
    isLoading,
    error,
    refetch: fetchPetitions,
  };
}
