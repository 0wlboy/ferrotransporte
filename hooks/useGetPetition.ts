import { supabase } from "@/utils/supabase";
import { useCallback, useEffect, useState } from "react";

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
  const { userId = null, role = null, asignacion = null } = options;

  const [petitions, setPetitions] = useState<PetitionData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPetitions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // ── PASO 1: Obtener todas las peticiones ─────────────────────────────────
      let query = supabase.from("peticiones").select("*");

      if (asignacion) {
        query = query.eq("estado", asignacion);
      }

      if (userId && role) {
        const filterCol =
          role.toLowerCase() === "conductor" ? "ci_driver" : "ci_pasajero";
        query = query.eq(filterCol, userId);
      }

      const { data: peticionesData, error: peticionesError } =
        await query.order("created_at", {
          ascending: false,
        });

      if (peticionesError) throw new Error(peticionesError.message);
      if (!peticionesData || peticionesData.length === 0) {
        setPetitions([]);
        return;
      }

      console.log(
        "[useGetPetition] Peticiones obtenidas:",
        peticionesData.length,
      );

      // ── PASOS 2, 3 y 4: Por cada petición buscar usuarios y localizaciones ───
      const formattedData: PetitionData[] = await Promise.all(
        peticionesData.map(async (peticion: any) => {
          // Buscar datos del pasajero por ci_user
          const { data: pasajeroData } = await supabase
            .from("usuarios")
            .select("primer_nombre, apellido, foto_url")
            .eq("ci_user", peticion.ci_pasajero)
            .maybeSingle();

          const usuarioNombre = pasajeroData
            ? `${pasajeroData.primer_nombre ?? ""} ${pasajeroData.apellido ?? ""}`.trim()
            : "Usuario";
          const usuarioFoto = pasajeroData?.foto_url ?? null;

          // Buscar datos del conductor por ci_user (opcional)
          let conductorNombre = "";
          let conductorFoto: string | null = null;
          if (peticion.ci_driver) {
            const { data: conductorData } = await supabase
              .from("usuarios")
              .select("primer_nombre, apellido, foto_url")
              .eq("ci_user", peticion.ci_driver)
              .maybeSingle();

            if (conductorData) {
              conductorNombre = conductorData
                ? `${conductorData.primer_nombre ?? ""} ${conductorData.apellido ?? ""}`.trim()
                : "Por asignar";
              conductorFoto = conductorData.foto_url ?? null;
            }
          }

          // Buscar nombre del origen en localizaciones
          const { data: origenData } = await supabase
            .from("localizaciones")
            .select("nombre")
            .eq("id", peticion.origen_id)
            .maybeSingle();

          const origenNombre: string =
            origenData?.nombre ?? String(peticion.origen_id);

          // Buscar nombre del destino en localizaciones
          const { data: destinoData } = await supabase
            .from("localizaciones")
            .select("nombre")
            .eq("id", peticion.destino_id)
            .maybeSingle();

          const destinoNombre: string =
            destinoData?.nombre ?? String(peticion.destino_id);

          console.log(
            `[useGetPetition] Petición ${peticion.id}: usuario="${usuarioNombre}" origen="${origenNombre}" destino="${destinoNombre}"`,
          );

          return {
            id: String(peticion.id ?? ""),
            pasajero_id: String(peticion.ci_pasajero ?? ""),
            driver_id: peticion.ci_driver ? String(peticion.ci_driver) : null,
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
            usuario: { nombre: usuarioNombre, foto_url: usuarioFoto },
            conductor: conductorNombre
              ? { nombre: conductorNombre, foto_url: conductorFoto }
              : null,
          };
        }),
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
  }, [userId, role, asignacion]);

  useEffect(() => {
    fetchPetitions();
  }, [userId, role, asignacion]);

  return { petitions, isLoading, error, refetch: fetchPetitions };
}
