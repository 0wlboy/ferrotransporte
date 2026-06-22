import { supabase } from "@/utils/supabase";
import { useCallback, useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

/** Datos que el hook retorna para cada localización. */
export interface LocationData {
    id: string;
    nombre: string; // nombre de la localización
}

/** Valor de retorno del hook. */
export interface UseGetLocationsReturn {
    locations: LocationData[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export function useGetLocations(): UseGetLocationsReturn {
    const [locations, setLocations] = useState<LocationData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLocations = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // ── PASO 1: Obtener todas las localizaciones (solo uuid/id y nombre) ──
            const { data: localizacionesData, error: localizacionesError } = await supabase
                .from("localizaciones")
                .select("id, nombre")
                .neq("deleted", true)
                .order("nombre", { ascending: true });

            if (localizacionesError) throw new Error(localizacionesError.message);
            if (!localizacionesData || localizacionesData.length === 0) {
                setLocations([]);
                return;
            }

            console.log(
                "[useGetLocations] Localizaciones obtenidas:",
                localizacionesData.length,
            );

            // Mapear los datos de manera limpia y síncrona
            const formattedData: LocationData[] = localizacionesData.map((localizacion: any) => ({
                id: String(localizacion.id ?? ""),
                nombre: String(localizacion.nombre ?? ""),
            }));

            setLocations(formattedData);
            console.log(
                "[useGetLocations] Localizaciones formateadas:",
                formattedData.length,
            );
        } catch (err: any) {
            console.error("[useGetLocations] Error:", err);
            setError(err?.message || "Error desconocido al obtener localizaciones");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLocations();
    }, [fetchLocations]);

    return { locations, isLoading, error, refetch: fetchLocations };
}
