import { useUploadImage } from "@/hooks/useUploadImage";
import { supabase } from "@/utils/supabase";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "./auth-context";

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS Y DEFINICIONES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} VehicleProfile
 * Representa el perfil del vehículo asociado al conductor autenticado.
 *
 * @property {string}      id        - UUID único del vehículo.
 * @property {string|null} ci_driver - CI del conductor.
 * @property {string|null} modelo    - Modelo del vehículo.
 * @property {string|null} marca     - Marca del vehículo.
 * @property {string|null} placa     - Placa del vehículo.
 * @property {string|null} año     - Año del vehículo.
 * @property {string|null} estado     - Estado del vehiculo
 * @property {number|null} num_asientos    - N° de asientos del vehículo.
 * @property {boolean|null} maletero_amplio    - Maletero amplio del vehículo.
 * @property {string|null} foto_url  - URL de la foto del vehículo.
 */

/**
 * @typedef {Object} CarContextType
 *
 * @property {VehicleProfile|null} car   - Perfil del vehículo en sesión. Null si no existe.
 * @property {boolean} isLoading         - Indica si se está procesando una operación.
 * @property {boolean} isInitializing    - Indica si el contexto está cargando el vehículo.
 * @property {Function} updateCar        - Actualiza la información del vehículo.
 * @property {Function} refreshCar       - Recarga los datos del vehículo desde la BD.
 */

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXTO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Contexto del vehículo del conductor.
 * Provee acceso al estado del vehículo y funciones de gestión desde cualquier componente.
 */
const CarContext = createContext(null);

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * CarProvider — Proveedor del contexto del vehículo.
 *
 * Responsabilidades:
 * - Al montar, busca en la tabla `vehiculo` el registro cuyo `ci_driver`
 *   coincida con el `ci_user` del usuario autenticado.
 * - Expone `car` (datos del vehículo) y `updateCar` a los componentes hijos.
 * - Actualiza el estado en memoria tras cada edición exitosa.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Árbol de componentes hijos.
 */
export function CarProvider({ children }) {
  /** @type {[VehicleProfile|null, Function]} */
  const [car, setCar] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const { user } = useAuth();
  const { uploadImage } = useUploadImage();

  // ───────────────────────────────────────────────────────────────────────
  // CARGA INICIAL: buscar el vehículo del conductor al montar
  // ───────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (user?.ci_user) {
      loadCarProfile(user.ci_user).finally(() => setIsInitializing(false));
    } else {
      // No hay CI disponible — no es conductor o aún no tiene CI registrada
      setIsInitializing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.ci_user]);

  // ───────────────────────────────────────────────────────────────────────
  // FUNCIONES INTERNAS
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Busca en la tabla `vehiculo` el registro donde `ci_driver` coincida
   * con la CI del usuario autenticado. Si se encuentra, guarda el perfil
   * del vehículo en memoria.
   *
   * @param {string} ciUser - CI del usuario autenticado (ci_user).
   */
  const loadCarProfile = async (ciUser) => {
    try {
      console.log("[CarContext] Buscando vehículo para ci_driver:", ciUser);

      const { data: vehicle, error } = await supabase
        .from("vehiculos")
        .select("*")
        .eq("ci_driver", ciUser)
        .maybeSingle();

      if (error) {
        console.error(
          "[CarContext] Error al consultar la tabla 'vehiculos':",
          error.message,
          "Código:",
          error.code,
        );
        return;
      }

      if (!vehicle) {
        console.warn(
          "[CarContext] No se encontró ningún vehículo para ci_driver:",
          ciUser,
        );
        setCar(null);
        return;
      }

      console.log(
        "[CarContext] Vehículo cargado exitosamente de la BD:",
        vehicle,
      );

      /** @type {VehicleProfile} */
      const carProfile = {
        id: vehicle.id ?? null,
        modelo: vehicle.modelo ?? null,
        marca: vehicle.marca ?? null,
        placa: vehicle.placa ?? null,
        año: vehicle.año ?? null,
        estado: vehicle.estado ?? null,
        num_asientos: vehicle.num_asientos ?? null,
        maletero_amplio: vehicle.maletero_amplio ?? null,
        foto_url: vehicle.foto_url ?? null,
      };

      setCar(carProfile);
    } catch (err) {
      console.error(
        "[CarContext] Error inesperado al cargar perfil del vehículo:",
        err,
      );
    }
  };

  // ───────────────────────────────────────────────────────────────────────
  // FUNCIÓN: Recargar datos del vehículo
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Vuelve a consultar la BD y refresca el estado del vehículo en memoria.
   * Útil para forzar una recarga desde la pantalla de perfil.
   *
   * @returns {Promise<void>}
   */
  const refreshCar = useCallback(async () => {
    if (!user?.ci_user) return;
    setIsLoading(true);
    try {
      await loadCarProfile(user.ci_user);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.ci_user]);

  // ───────────────────────────────────────────────────────────────────────
  // FUNCIÓN: Actualizar información del vehículo
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Actualiza la información del vehículo del conductor autenticado.
   *
   * Flujo:
   * 1. Si se envió una imagen nueva, la sube a Storage y obtiene la URL pública.
   * 2. Construye un objeto solo con los campos que realmente cambiaron (diff).
   * 3. Persiste los cambios en la tabla `vehiculo` filtrando por `ci_driver`.
   * 4. Actualiza el estado en memoria para reflejar los cambios sin recargar.
   *
   * @param {Object} params
   * @param {import('@/components/ui/profile-picker').PickedImage|null} params.profileImage - Nueva foto del vehículo (opcional).
   * @param {string} [params.modelo]  - Nuevo modelo.
   * @param {string} [params.marca]   - Nueva marca.
   * @param {number} [params.año]   - Año del vehículo.
   * @param {string} [params.estado]   - Estado del vehículo.
   * @param {number} [params.num_asientos]  - Nuevo N° de asientos.
   * @param {string} [params.maletero_amplio]   - Maletero amplio del vehículo.
   * @returns {Promise<{success?: boolean, error?: string}>}
   */
  const updateCar = useCallback(
    async ({
      profileImage = null,
      modelo,
      marca,
      año,
      estado,
      num_asientos,
      maletero_amplio,
    }) => {
      if (!user?.ci_user) {
        return { error: "Usuario no autenticado o sin CI registrada." };
      }

      if (!car?.id) {
        return {
          error: "No se encontró un vehículo asociado a este conductor.",
        };
      }

      setIsLoading(true);

      try {
        // ── Paso 1: Subir imagen si se seleccionó una nueva ──
        let nuevaFotoUrl = undefined;
        if (profileImage) {
          nuevaFotoUrl = await uploadImage(profileImage, {
            bucket: "fotosCarros",
            placa: car?.placa,
            uniqueFileName: false,
            upsert: true,
          });

          if (!nuevaFotoUrl) {
            console.warn(
              "[CarContext] No se pudo subir la imagen. Continuando sin actualizar foto.",
            );
          }
        }

        // ── Paso 2: Construir objeto SOLO con campos que cambiaron ──
        const dbChanges = {};

        if (modelo !== undefined && modelo !== car.modelo)
          dbChanges.modelo = modelo;
        if (marca !== undefined && marca !== car.marca) dbChanges.marca = marca;
        if (año !== undefined && año !== car.año) dbChanges.año = año;
        if (num_asientos !== undefined && num_asientos !== car.num_asientos)
          dbChanges.num_asientos = num_asientos;
        if (
          maletero_amplio !== undefined &&
          maletero_amplio !== car.maletero_amplio
        )
          dbChanges.maletero_amplio = maletero_amplio;
        if (estado !== undefined && estado !== car.estado)
          dbChanges.estado = estado;
        if (nuevaFotoUrl) dbChanges.foto_url = nuevaFotoUrl;

        if (Object.keys(dbChanges).length === 0) {
          return { error: "No hay cambios para guardar." };
        }

        // ── Paso 3: Persistir cambios en la tabla `vehiculo` ──
        dbChanges.updated_at = new Date().toISOString();

        const { error: updateError } = await supabase
          .from("vehiculos")
          .update(dbChanges)
          .eq("placa", car.placa);

        if (updateError) {
          console.error(
            "[CarContext] Error al actualizar tabla vehiculos:",
            updateError.message,
          );
          return { error: updateError.message };
        }

        // ── Paso 4: Reflejar cambios en el estado en memoria ──
        setCar((prev) => ({
          ...prev,
          ...dbChanges,
        }));

        console.log(
          "[CarContext] Vehículo actualizado. Campos modificados:",
          Object.keys(dbChanges),
        );

        return { success: true };
      } catch (err) {
        console.error("[CarContext] Error inesperado en updateCar:", err);
        return { error: "Ocurrió un error inesperado. Intenta de nuevo." };
      } finally {
        setIsLoading(false);
      }
    },
    [car, user, uploadImage],
  );

  // ───────────────────────────────────────────────────────────────────────
  // VALOR DEL CONTEXTO
  // ───────────────────────────────────────────────────────────────────────

  /** @type {CarContextType} */
  const contextValue = {
    car,
    isLoading,
    isInitializing,
    updateCar,
    refreshCar,
  };

  return (
    <CarContext.Provider value={contextValue}>{children}</CarContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK PERSONALIZADO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hook `useCars` — Acceso al contexto del vehículo del conductor.
 *
 * Uso:
 * ```js
 * const { car, updateCar, isLoading } = useCars();
 * ```
 *
 * @throws {Error} Si se usa fuera de un `<CarProvider>`.
 * @returns {CarContextType} El valor completo del contexto del vehículo.
 */
export function useCars() {
  const context = useContext(CarContext);
  if (!context) {
    throw new Error(
      "[useCars] El hook debe usarse dentro de un <CarProvider>. " +
        "Asegúrate de envolver tu árbol de componentes con <CarProvider>.",
    );
  }
  return context;
}
