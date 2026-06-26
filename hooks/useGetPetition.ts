import { supabase } from "@/utils/supabase";
import { useCallback, useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

/** Datos que el hook retorna para cada petición. */
export interface PetitionData {
  id: string;
  pasajero_id: string;
  driver_id: string | null;
  origen: string; // nombre de la localización origen
  destino: string; // nombre de la localización destino
  origen_id: string;
  destino_id: string;
  acompañantes: number;
  prioridad: string;
  carga: string | null;
  estado: string;
  created_at: string;
  descripcion: string;
  usuario: { nombre: string; foto_url: string | null } | null;
  conductor: { nombre: string; foto_url: string | null } | null;
}

/** Opciones de filtrado del hook. */
export interface UseGetPetitionOptions {
  userId?: string | null;
  role?: "Pasajero" | "Conductor" | string | null;
  asignacion?:
  | "Pendiente"
  | "Completado"
  | "Cancelado"
  | "En Camino"
  | string
  | null;
}

/** Valor de retorno del hook. */
export interface UseGetPetitionReturn {
  petitions: PetitionData[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────────────────

export function useGetPetition(
  options: UseGetPetitionOptions = {},
): UseGetPetitionReturn {
  const hasUserIdFilter = "userId" in options;
  const { userId = null, role = null, asignacion = null } = options;
  const normalizedUserId = userId ? String(userId).trim() : "";

  const [petitions, setPetitions] = useState<PetitionData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Ref para el debounce del real-time
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPetitions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (hasUserIdFilter && !normalizedUserId) {
        setPetitions([]);
        return;
      }

      // ── PASO 1: Obtener todas las peticiones en una sola query ───────────────
      let query = supabase
        .from("peticiones")
        .select("*")
        .neq("deleted", true);

      if (asignacion) {
        query = query.eq("estado", asignacion);
      }

      if (hasUserIdFilter) {
        query = query.or(
          `ci_pasajero.eq.${normalizedUserId},ci_driver.eq.${normalizedUserId}`,
        );
      }

      const { data: peticionesData, error: peticionesError } =
        await query.order("created_at", { ascending: false });

      if (peticionesError) throw new Error(peticionesError.message);
      if (!peticionesData || peticionesData.length === 0) {
        setPetitions([]);
        return;
      }

      // ── PASO 2: Recopilar IDs únicos para batch queries ──────────────────────
      const ciSet = new Set<string>();
      const locationIdSet = new Set<string>();

      for (const p of peticionesData) {
        if (p.ci_pasajero) ciSet.add(String(p.ci_pasajero));
        if (p.ci_driver) ciSet.add(String(p.ci_driver));
        if (p.origen_id) locationIdSet.add(String(p.origen_id));
        if (p.destino_id) locationIdSet.add(String(p.destino_id));
      }

      const uniqueCIs = Array.from(ciSet);
      const uniqueLocationIds = Array.from(locationIdSet);

      // ── PASO 3: Batch queries en paralelo (2 queries en total) ───────────────
      const [usuariosResult, localizacionesResult] = await Promise.all([
        uniqueCIs.length > 0
          ? supabase
              .from("usuarios")
              .select("ci_user, primer_nombre, apellido, foto_url")
              .in("ci_user", uniqueCIs)
          : Promise.resolve({ data: [], error: null }),
        uniqueLocationIds.length > 0
          ? supabase
              .from("localizaciones")
              .select("id, nombre")
              .in("id", uniqueLocationIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      // Construir mapas para búsqueda O(1)
      const usuariosMap = new Map<
        string,
        { nombre: string; foto_url: string | null }
      >();
      for (const u of usuariosResult.data ?? []) {
        const nombre =
          `${u.primer_nombre ?? ""} ${u.apellido ?? ""}`.trim() || "Usuario";
        usuariosMap.set(String(u.ci_user), {
          nombre,
          foto_url: u.foto_url ?? null,
        });
      }

      const localizacionesMap = new Map<string, string>();
      for (const loc of localizacionesResult.data ?? []) {
        localizacionesMap.set(String(loc.id), loc.nombre);
      }

      // ── PASO 4: Formatear datos con lookups O(1) — sin queries adicionales ───
      const formattedData: PetitionData[] = peticionesData.map(
        (peticion: any) => {
          const pasajeroCI = String(peticion.ci_pasajero ?? "");
          const conductorCI = peticion.ci_driver
            ? String(peticion.ci_driver)
            : null;

          const usuarioInfo = usuariosMap.get(pasajeroCI) ?? {
            nombre: "Usuario",
            foto_url: null,
          };
          const conductorInfo = conductorCI
            ? usuariosMap.get(conductorCI) ?? null
            : null;

          const origenNombre =
            localizacionesMap.get(String(peticion.origen_id ?? "")) ??
            String(peticion.origen_id);
          const destinoNombre =
            localizacionesMap.get(String(peticion.destino_id ?? "")) ??
            String(peticion.destino_id);

          return {
            id: String(peticion.id ?? ""),
            pasajero_id: pasajeroCI,
            driver_id: conductorCI,
            origen: origenNombre,
            destino: destinoNombre,
            origen_id: String(peticion.origen_id ?? ""),
            destino_id: String(peticion.destino_id ?? ""),
            acompañantes: Number(
              peticion.acompañantes ?? peticion.pasajeros ?? 1,
            ),
            prioridad: peticion.prioridad ?? "Mediana",
            carga: peticion.carga ?? null,
            descripcion: peticion.descripcion ?? null,
            estado: peticion.estado ?? "Pendiente",
            created_at: peticion.created_at ?? new Date().toISOString(),
            usuario: usuarioInfo,
            conductor: conductorInfo,
          };
        },
      );

      setPetitions(formattedData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Excepción desconocida.";
      console.error("[useGetPetition] Error:", err);
      setError(`No se pudieron cargar las peticiones: ${msg}`);
      setPetitions([]);
    } finally {
      setIsLoading(false);
    }
  }, [normalizedUserId, role, asignacion, hasUserIdFilter]);

  useEffect(() => {
    fetchPetitions();

    // Generar un nombre de canal único para evitar colisiones en la suscripción en tiempo real
    const channelId = `peticiones-changes-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "peticiones",
        },
        () => {
          // Debounce: evitar múltiples re-fetches si llegan cambios en ráfaga
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }
          debounceTimerRef.current = setTimeout(() => {
            fetchPetitions();
          }, 500);
        },
      )
      .subscribe();

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [normalizedUserId, role, asignacion, hasUserIdFilter, fetchPetitions]);

  return { petitions, isLoading, error, refetch: fetchPetitions };
}
