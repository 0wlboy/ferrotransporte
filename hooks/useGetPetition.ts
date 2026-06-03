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
    pasajero_id: string;
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

    /** Driver user profile details (joined). */
    conductor?: {
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
    userId?: string | null;
    /** Role of the active user: "Pasajero" | "Conductor" (case-insensitive). */
    role?: "Pasajero" | "Conductor" | string | null;
    /** If true, filters out any petitions with state equal to 'por asignacion'. Default is true. */
    asignacion?: "Pendiente" | "Completado" | "Cancelado" | "En Camino" | string | null;
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


// schema

const SCHEMA: SchemaConfig = {
    select: `
    *,
    usuario:usuarios!ci_pasajero (
      primer_nombre,
      apellido,
      foto_url
    ),
    conductor:usuarios!ci_driver (
      primer_nombre,
      apellido,
      foto_url
    )
  `,
    passengerCol: "ci_pasajero",
    driverCol: "ci_driver",

};

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
    const { userId = null, role = null, asignacion = null } = options;

    const [petitions, setPetitions] = useState<PetitionData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPetitions = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            let query = supabase.from("peticiones").select(SCHEMA.select);

            // 1. Exclude status 'por asignacion' if requested
            if (asignacion) {
                query = query.eq("estado", asignacion);
            }

            // 2. Apply dynamic role filtering if userId & role are provided
            if (userId && role) {
                const isConductor = role.toLowerCase() === "conductor";
                const filterCol = isConductor ? SCHEMA.driverCol : SCHEMA.passengerCol;
                query = query.eq(filterCol, userId);
            }

            // Execute query
            const { data, error: queryError } = await query.order("created_at", { ascending: false });

            console.log("[useGetPetition] Query params -> userId:", userId, "asignacion:", asignacion);
            console.log("[useGetPetition] Supabase Response Data Length:", data?.length, "Error:", queryError);

            if (queryError) {
                throw new Error(queryError.message);
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

                    // Concatenate names for conductor
                    let conductorName = "";
                    let conductorPhoto: string | null = null;

                    if (item.conductor) {
                        const c = Array.isArray(item.conductor) ? item.conductor[0] : item.conductor;
                        if (c) {
                            const firstName = c.primer_nombre || "";
                            const lastName = c.apellido || "";
                            conductorName = `${firstName} ${lastName}`.trim() || "Conductor";
                            conductorPhoto = c.foto_url || null;
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
                        pasajero_id: (item.ci_pasajero || "").toString(),
                        driver_id: (item.ci_driver || null)?.toString() ?? null,
                        origen: locName,
                        destino: item.destino || "",
                        acompañantes: Number(item.acompañantes || item.pasajeros || 1),
                        prioridad: item.prioridad || "Mediana",
                        carga: item.carga || null,
                        estado: item.estado || "Pendiente",
                        created_at: item.created_at || new Date().toISOString(),
                        usuario: userName ? { nombre: userName, foto_url: userPhoto } : null,
                        conductor: conductorName ? { nombre: conductorName, foto_url: conductorPhoto } : null,
                        vehiculo: vehicleModel ? { foto_url: vehiclePhoto, modelo: vehicleModel } : null,
                    };
                });

                setPetitions(formattedData);
            }
        } catch (err) {
            const lastErrorMessage = err instanceof Error ? err.message : "Excepción desconocida.";
            console.error("[useGetPetition] Error executing query:", err);
            setError(`No se pudieron cargar las peticiones: ${lastErrorMessage}`);
            setPetitions([]);
        } finally {
            setIsLoading(false);
        }
    }, [userId, role, asignacion]);

    // Fetch data on mount and whenever options change
    useEffect(() => {
        fetchPetitions();
    }, [userId, role, asignacion]);

    return {
        petitions,
        isLoading,
        error,
        refetch: fetchPetitions,
    };
}
