import { useUploadImage } from "@/hooks/useUploadImage";
import { supabase } from "@/utils/supabase";
import { router } from "expo-router";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS Y DEFINICIONES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} UserProfile
 * Representa el perfil del usuario autenticado almacenado en memoria.
 *
 * @property {string} id          - UUID único del usuario en Supabase Auth.
 * @property {string} email       - Correo electrónico del usuario.
 * @property {string|null} nombre - Nombre del usuario (si fue registrado).
 * @property {string|null} apellido - Apellido del usuario (si fue registrado).
 * @property {string|null} telefono - Teléfono del usuario.
 * @property {string|null} cedula - Cédula del usuario.
 * @property {string|null} fotoUrl - URL de la foto del usuario.
 * @property {string|null} role    - Rol del usuario en el sistema (ej: 'admin', 'conductor').
 * @property {string} createdAt   - Fecha de creación de la cuenta ISO 8601.
 */

/**
 * @typedef {Object} AuthContextType
 *
 * @property {UserProfile|null} user              - Perfil del usuario en sesión. Null si no autenticado.
 * @property {boolean} isAuthenticated            - Indica si hay una sesión activa.
 * @property {boolean} isLoading                  - Indica si se está procesando una operación de auth.
 * @property {boolean} isInitializing             - Indica si el contexto está cargando la sesión guardada.
 * @property {Function} signIn                    - Inicia sesión con email y contraseña.
 * @property {Function} signUp                    - Registra un nuevo usuario.
 * @property {Function} signOut                   - Cierra la sesión y libera la memoria del dispositivo.
 */

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXTO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Contexto de autenticación global de la aplicación.
 * Provee acceso al estado del usuario y funciones de auth desde cualquier componente.
 */
const AuthContext = createContext(null);

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * AuthProvider — Proveedor del contexto de autenticación.
 *
 * Responsabilidades:
 * - Detecta y restaura sesiones guardadas en el dispositivo al iniciar la app.
 * - Expone funciones de signIn, signUp y signOut a todos los componentes hijos.
 * - Almacena el perfil del usuario en memoria (estado React) durante la sesión.
 * - Libera la memoria del usuario al cerrar sesión.
 * - Navega automáticamente según el estado de autenticación.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Árbol de componentes hijos.
 */
export function AuthProvider({ children }) {
  /** @type {[UserProfile|null, Function]} */
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const { uploadImage, uploading, error: uploadError } = useUploadImage();

  // ───────────────────────────────────────────────────────────────────────
  // INICIALIZACIÓN: Detectar sesión guardada en el dispositivo
  // ───────────────────────────────────────────────────────────────────────

  useEffect(() => {
    /**
     * Intenta recuperar la sesión activa guardada en localStorage del dispositivo.
     * Si existe, carga el perfil extendido desde la tabla `usuarios`.
     */
    const initializeSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error(
            "[AuthContext] Error al recuperar sesión:",
            error.message,
          );
          return;
        }

        if (session?.user) {
          await loadUserProfile(session.user);
        }
      } catch (err) {
        console.error("[AuthContext] Error inesperado en inicialización:", err);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeSession();

    /**
     * Listener de cambios de estado de autenticación de Supabase.
     * Detecta cambios en la sesión (token refresh, cierre de sesión externo, etc).
     */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        await loadUserProfile(session.user);
      } else if (event === "SIGNED_OUT") {
        // Liberar memoria del usuario al detectar cierre de sesión
        setUser(null);
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        // Mantener el perfil actualizado tras refresh de token
        await loadUserProfile(session.user);
      }
    });

    // Limpiar el listener al desmontar el provider
    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  // ───────────────────────────────────────────────────────────────────────
  // FUNCIONES INTERNAS
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Carga el perfil extendido del usuario desde la tabla `usuarios` en Supabase.
   * Combina los datos de Supabase Auth con los datos adicionales del perfil.
   *
   * @param {import('@supabase/supabase-js').User} authUser - Usuario de Supabase Auth.
   */
  const loadUserProfile = async (authUser) => {
    try {
      const { data: profile, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("auth_id", authUser.id)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows found (perfil aún no creado, es normal en registro)
        console.error("[AuthContext] Error al cargar perfil:", error.message);
      }

      // Construir objeto de usuario en memoria fusionando datos de auth y perfil
      const userProfile = {
        id: authUser.id,
        email: authUser.email,
        nombre: profile
          ? `${profile.primer_nombre ?? ""} ${profile.apellido ?? ""}`.trim()
          : null,
        fotoUrl: profile?.foto_url ?? null,
        gerencia: profile?.gerencia ?? null,
        role: profile?.role ?? null,
        createdAt: authUser.created_at,
      };

      // Guardar en memoria del estado React (no persistido aquí — eso lo hace Supabase)
      setUser(userProfile);
    } catch (err) {
      console.error("[AuthContext] Error inesperado al cargar perfil:", err);
    }
  };

  // ───────────────────────────────────────────────────────────────────────
  // FUNCIÓN: Inicio de sesión
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Autentica a un usuario existente con email y contraseña.
   *
   * Flujo:
   * 1. Llama a Supabase Auth con las credenciales.
   * 2. Si hay error, lo mapea a un mensaje legible y lo retorna.
   * 3. Si es exitoso, carga el perfil del usuario en memoria y navega a home.
   *
   * @param {string} email       - Correo electrónico del usuario.
   * @param {string} password    - Contraseña del usuario.
   * @returns {Promise<{error: string|null}>} - Null en éxito, mensaje de error en fallo.
   */
  const signIn = useCallback(async (email, password) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (data?.user) {
        const { error: rpcError } = await supabase.rpc("login_update", {
          auth_id: data.user.id,
        });
        if (rpcError) {
          console.error(
            "[AuthContext] Error al actualizar login:",
            rpcError.message,
          );
          // No bloqueamos el flujo si falla la inserción del perfil extendido,
          // el usuario ya fue creado en Auth y se puede reintentar el perfil.
        }
      }

      if (error) {
        // Mapear mensajes de error de Supabase a español
        return { error: mapAuthError(error.message) };
      }

      // Cargar el perfil del usuario antes de navegar para evitar parpadeos en la UI
      if (data?.user) {
        await loadUserProfile(data.user);
      }

      // Navegar a la pantalla principal de la app
      router.replace("/(auth)/home");
      return { error: null };
    } catch (err) {
      console.error("[AuthContext] Error inesperado en signIn:", err);
      return { error: "Ocurrió un error inesperado. Intenta de nuevo." };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ───────────────────────────────────────────────────────────────────────
  // FUNCIÓN: Registro de nuevo usuario
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Registra un nuevo usuario en el sistema.
   *
   * Flujo:
   * 1. Verifica si el email ya está registrado en la tabla `usuarios` (campo único).
   * 2. Si existe, retorna un error para mostrar bajo el input de email.
   * 3. Si no existe, crea la cuenta en Supabase Auth.
   * 4. Inserta el perfil extendido en la tabla `usuarios`.
   * 5. Navega al home.
   *
   * @param {string} email       - Correo electrónico único del nuevo usuario.
   * @param {string} password    - Contraseña del nuevo usuario.
   * @param {string} nombre      - Nombre completo del nuevo usuario.
   * @returns {Promise<{emailError: string|null, passwordError: string|null, generalError: string|null}>}
   */
  const signUp = useCallback(
    async ({
      profileImage,
      email,
      password,
      nombre,
      apellido,
      ci,
      telefono,
      gerencia,
    }) => {
      setIsLoading(true);

      const normalizedEmail = email.trim().toLowerCase();

      try {
        // ── Paso 1: Verificar unicidad del email en la tabla usuarios ──
        const { data: existingUser, error: checkError } = await supabase
          .from("usuarios")
          .select("id")
          .eq("email", normalizedEmail)
          .maybeSingle();

        if (checkError) {
          console.error(
            "[AuthContext] Error al verificar email:",
            checkError.message,
          );
          return {
            emailError: null,
            passwordError: null,
            generalError: "Error al verificar datos. Intenta de nuevo.",
          };
        }

        // Email ya registrado → error específico para mostrar bajo el input
        if (existingUser) {
          return {
            emailError: "Este correo electrónico ya está registrado.",
            passwordError: null,
            generalError: null,
          };
        }

        // ── Paso 2: Crear cuenta en Supabase Auth ──
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email: normalizedEmail,
            password,
            options: {
              data: { nombre: `${nombre.trim()} ${apellido.trim()}` }, // Nombre completo en metadatos
            },
          },
        );

        if (authError) {
          return {
            emailError: null,
            passwordError: null,
            generalError: mapAuthError(authError.message),
          };
        }

        // Subir foto de perfil
        let fotoPerfil;
        if (profileImage) {
          fotoPerfil = await uploadImage(profileImage, {
            bucket: "fotosPerfil",
            userAuthId: authData.user.id,
            uniqueFileName: false,
            upsert: true,
          });

          if (!fotoPerfil) {
            console.warn(
              "No se pudo subir la imagen de perfil. Continuando sin foto...",
            );
            // No abortamos — continuamos el registro sin foto
          }
        }

        // ── Paso 3: Insertar perfil extendido en la tabla `usuarios` ──
        if (authData?.user) {
          const { error: insertError } = await supabase
            .from("usuarios")
            .insert({
              auth_id: authData.user.id, // FK a auth.users
              email: normalizedEmail,
              primer_nombre: nombre.trim(),
              apellido: apellido.trim(),
              ci_user: ci,
              telf: telefono,
              foto_url: fotoPerfil ?? null,
              gerencia: gerencia,
              role: "Pasajero",
              activo: true, // verdadero por defecto
              updated_at: new Date().toISOString(),
              total_login_count: 1,
              last_login: new Date().toISOString(),
              created_at: new Date().toISOString(),
            });

          if (insertError) {
            console.error(
              "[AuthContext] Error al crear perfil:",
              insertError.message,
            );
            // No bloqueamos el flujo si falla la inserción del perfil extendido,
            // el usuario ya fue creado en Auth y se puede reintentar el perfil.
          } else {
            // Cargar el perfil recién creado en memoria para evitar condiciones de carrera con onAuthStateChange
            await loadUserProfile(authData.user);
          }
        }

        // Navegar a la pantalla principal de la app
        router.replace("/(auth)/home");
        return { emailError: null, passwordError: null, generalError: null };
      } catch (err) {
        console.error("[AuthContext] Error inesperado en signUp:", err);
        return {
          emailError: null,
          passwordError: null,
          generalError: "Ocurrió un error inesperado. Intenta de nuevo.",
        };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // ───────────────────────────────────────────────────────────────────────
  // FUNCIÓN: Cierre de sesión
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Cierra la sesión del usuario activo.
   *
   * Flujo:
   * 1. Llama a Supabase Auth para invalidar el token en el servidor.
   * 2. El onAuthStateChange detecta el SIGNED_OUT y ejecuta setUser(null),
   *    liberando la memoria del perfil del dispositivo.
   * 3. Navega a la pantalla de login.
   *
   * @returns {Promise<void>}
   */
  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      const { error: insertError } = await supabase
        .from("usuarios")
        .update({
          activo: false,
        })
        .eq("auth_id", user?.id);

      if (insertError) {
        console.error(
          "[AuthContext] Error al actualizar estado activo:",
          insertError.message,
        );
        // No bloqueamos el flujo si falla
      }

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("[AuthContext] Error al cerrar sesión:", error.message);
      }

      // Liberar inmediatamente la memoria del estado — no esperar al listener
      setUser(null);

      // Navegar al login y limpiar el stack de navegación
      router.replace("/login");
    } catch (err) {
      console.error("[AuthContext] Error inesperado en signOut:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ───────────────────────────────────────────────────────────────────────
  // UTILIDADES
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Mapea mensajes de error en inglés de Supabase Auth a mensajes en español
   * legibles para el usuario final.
   *
   * @param {string} errorMessage - Mensaje de error de Supabase.
   * @returns {string} Mensaje traducido y amigable.
   */
  const mapAuthError = (errorMessage) => {
    const errorMap = {
      "Invalid login credentials": "Correo o contraseña incorrectos.",
      "Email not confirmed":
        "Debes confirmar tu correo antes de iniciar sesión.",
      "User already registered": "Este correo ya está registrado.",
      "Password should be at least 6 characters":
        "La contraseña debe tener al menos 6 caracteres.",
      "Unable to validate email address: invalid format":
        "El formato del correo no es válido.",
      "signup is disabled":
        "El registro de nuevos usuarios está temporalmente desactivado.",
      //'Email rate limit exceeded': 'Demasiados intentos. Espera un momento e intenta de nuevo.',
      invalid_credentials: "Correo o contraseña incorrectos.",
    };

    // Buscar coincidencia parcial en el mapa de errores
    for (const [key, value] of Object.entries(errorMap)) {
      if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }

    return "Ocurrió un error. Por favor intenta de nuevo.";
  };

  // ───────────────────────────────────────────────────────────────────────
  // VALOR DEL CONTEXTO
  // ───────────────────────────────────────────────────────────────────────

  /** @type {AuthContextType} */
  const contextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isInitializing,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK PERSONALIZADO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hook `useAuth` — Acceso al contexto de autenticación.
 *
 * Uso:
 * ```js
 * const { user, signIn, signOut, isAuthenticated } = useAuth();
 * ```
 *
 * @throws {Error} Si se usa fuera de un `<AuthProvider>`.
 * @returns {AuthContextType} El valor completo del contexto de autenticación.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(
      "[useAuth] El hook debe usarse dentro de un <AuthProvider>. " +
        "Asegúrate de envolver tu árbol de componentes con <AuthProvider>.",
    );
  }
  return context;
}
