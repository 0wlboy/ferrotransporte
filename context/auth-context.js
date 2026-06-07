import { useUploadImage } from "@/hooks/useUploadImage";
import { supabase } from "@/utils/supabase";
import * as Linking from "expo-linking";
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
 * @property {string|null} primer_nombre - Nombre del usuario (si fue registrado).
 * @property {string|null} apellido - Apellido del usuario (si fue registrado).
 * @property {string|null} telf - Teléfono del usuario.
 * @property {string|null} ci_user - Cédula del usuario.
 * @property {string|null} foto_url - URL de la foto del usuario.
 * @property {string|null} gerencia - Gerencia a la que pertenece el usuario.
 * @property {string|null} id_gerencia - ID/UUID de la gerencia a la que pertenece el usuario.
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
 * @property {Function} sendResetEmail             - Envia un correo para reiniciar la contraseña
 * @property {Function} resetPassword             - Actualiza la contraseña de Usuario
 * @property {Function} updateProfile             - Actualiza el perfil del usuario.
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
  const [error, setError] = useState(null);

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
      console.log("[AuthContext] Cargando perfil para auth_id:", authUser.id);

      const { data: profile, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("auth_id", authUser.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          console.warn(
            "[AuthContext] No se encontró ningún registro en la tabla 'usuarios' para auth_id:",
            authUser.id,
          );
        } else {
          console.error(
            "[AuthContext] Error al consultar la tabla 'usuarios':",
            error.message,
            "Código:",
            error.code,
          );
        }
      } else {
        console.log(
          "[AuthContext] Fila de usuario cargada exitosamente de la BD:",
          profile,
        );
      }

      let locatioNombre = null;
      if (profile?.id_gerencia) {
        const { data: locData } = await supabase
          .from("localizaciones")
          .select("nombre")
          .eq("id", profile.id_gerencia)
          .single();
        if (locData) {
          locatioNombre = locData.nombre;
        }
      }

      // Construir objeto de usuario en memoria fusionando datos de auth, perfil consultado y authUser como fallback robusto
      const userProfile = {
        id: authUser.id,
        email: authUser.email || profile?.email,
        primer_nombre:
          profile?.primer_nombre ?? authUser?.primer_nombre ?? null,
        apellido: profile?.apellido ?? authUser?.apellido ?? null,
        ci_user: profile?.ci_user ?? authUser?.ci_user ?? null,
        telf: profile?.telf ?? authUser?.telf ?? null,
        foto_url: profile?.foto_url ?? authUser?.foto_url ?? null,
        gerencia: locatioNombre,
        id_gerencia: profile?.id_gerencia ?? null,
        role: profile?.role ?? authUser?.role ?? "Pasajero",
        createdAt:
          authUser.created_at || authUser.createdAt || new Date().toISOString(),
      };

      console.log(
        "[AuthContext] Estado 'user' final a guardar en memoria:",
        userProfile,
      );

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
        const { error: updateError } = await supabase
          .from("usuarios")
          .update({
            activo: true,
            last_login: new Date(),
          })
          .eq("auth_id", data.user.id);

        if (updateError) {
          console.error(
            "[AuthContext] Error al actualizar login:",
            updateError.message,
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
      id_gerencia,
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
              id_gerencia: id_gerencia,
              role: "Pasajero",
              activo: true, // verdadero por defecto
              updated_at: new Date().toISOString(),
              total_login_count: 1,
              last_login: new Date().toISOString(),
              created_at: new Date().toISOString(),
            });

          let locatioNombre = null;
          if (id_gerencia) {
            const { data: locData } = await supabase
              .from("localizaciones")
              .select("nombre")
              .eq("id", id_gerencia)
              .single();
            if (locData) {
              locatioNombre = locData.nombre;
            }
          }

          const DataUser = {
            id: authData.user.id,
            email: normalizedEmail,
            primer_nombre: nombre.trim(),
            apellido: apellido.trim(),
            ci_user: ci,
            telf: telefono,
            foto_url: fotoPerfil ?? null,
            gerencia: locatioNombre,
            id_gerencia: id_gerencia,
          };

          if (insertError) {
            console.error(
              "[AuthContext] Error al crear perfil:",
              insertError.message,
            );
            // No bloqueamos el flujo si falla la inserción del perfil extendido,
            // el usuario ya fue creado en Auth y se puede reintentar el perfil.
          } else {
            setUser(DataUser);
          }
        }

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
  // FUNCIÓN: Enviar email de renicio de contraseña
  // ───────────────────────────────────────────────────────────────────────

  const sendResetEmail = useCallback(async (email) => {
    try {
      setError(null);
      setIsLoading(true);

      const redirectUrl = Linking.createURL("/changePassword");
      console.log("[AuthContext] URL de redirección generada para restablecimiento:", redirectUrl);

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      console.log("Correo de restablecimiento enviado correctamente.");
      return { error: null };
    } catch (error) {
      console.error("Error al restablecer la contraseña:", error.message);
      const friendlyError = mapAuthError(error.message);
      setError(friendlyError);
      return { error: friendlyError };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ───────────────────────────────────────────────────────────────────────
  // FUNCIÓN: Reinicia la contraseña
  // ───────────────────────────────────────────────────────────────────────

  const resetPassword = useCallback(async (newPassword) => {
    try {
      setError(null);
      setIsLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      console.log("Contraseña actualizada correctamente.");
      return { error: null };
    } catch (error) {
      console.error("Error al actualizar la contraseña:", error.message);
      const friendlyError = mapAuthError(error.message);
      setError(friendlyError);
      return { error: friendlyError };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ───────────────────────────────────────────────────────────────────────
  // FUNCIÓN: Actualizar perfil
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Actualiza el perfil del usuario autenticado.
   *
   * Flujo:
   * 1. Si se envió una imagen nueva, la sube a Storage y obtiene la URL pública.
   * 2. Construye un objeto solo con los campos que realmente cambiaron (diff).
   * 3. Si cambió el email o la contraseña, los actualiza en Supabase Auth.
   * 4. Si hay campos de perfil modificados, los escribe en la tabla `usuarios`.
   * 5. Actualiza el estado en memoria para reflejar los cambios sin recargar.
   *
   * @param {Object} params
   * @param {import('@/components/ui/profile-picker').PickedImage|null} params.profileImage - Nueva imagen de perfil (opcional).
   * @param {string} [params.primer_nombre] - Nuevo nombre.
   * @param {string} [params.apellido]      - Nuevo apellido.
   * @param {string} [params.telf]          - Nuevo teléfono.
   * @param {string} [params.ci_user]       - Nueva cédula.
   * @param {string} [params.id_gerencia]      - Nueva gerencia.
   * @param {string} [params.email]         - Nuevo correo (actualiza Supabase Auth).
   * @param {string} [params.password]      - Nueva contraseña (actualiza Supabase Auth).
   * @returns {Promise<{success?: boolean, error?: string}>}
   */
  const updateProfile = useCallback(
    async ({
      profileImage = null,
      primer_nombre,
      apellido,
      telf,
      ci_user,
      id_gerencia,
      email: newEmail,
      password: newPassword,
    }) => {
      if (!user?.id) {
        return { error: "Usuario no autenticado." };
      }

      setIsLoading(true);

      try {
        // ── Paso 1: Subir imagen si se seleccionó una nueva ──
        let nuevaFotoUrl = undefined;
        if (profileImage) {
          nuevaFotoUrl = await uploadImage(profileImage, {
            bucket: "fotosPerfil",
            userAuthId: user.id,
            uniqueFileName: false,
            upsert: true,
          });

          if (!nuevaFotoUrl) {
            console.warn(
              "[AuthContext] No se pudo subir la imagen. Continuando sin actualizar foto.",
            );
          }
        }

        // ── Paso 2: Construir objeto SOLO con campos que cambiaron ──
        const dbChanges = {};

        if (primer_nombre !== undefined && primer_nombre !== user.primer_nombre)
          dbChanges.primer_nombre = primer_nombre;
        if (apellido !== undefined && apellido !== user.apellido)
          dbChanges.apellido = apellido;
        if (telf !== undefined && telf !== user.telf) dbChanges.telf = telf;
        if (ci_user !== undefined && ci_user !== user.ci_user)
          dbChanges.ci_user = ci_user;
        if (id_gerencia !== undefined && id_gerencia !== user.id_gerencia)
          dbChanges.id_gerencia = id_gerencia;
        if (nuevaFotoUrl) dbChanges.foto_url = nuevaFotoUrl;

        // ── Paso 3: Actualizar email/password en Supabase Auth si cambiaron ──
        const authChanges = {};
        if (newEmail && newEmail !== user.email) authChanges.email = newEmail;
        if (newPassword) authChanges.password = newPassword;

        if (Object.keys(authChanges).length > 0) {
          const { error: authUpdateError } =
            await supabase.auth.updateUser(authChanges);

          if (authUpdateError) {
            console.error(
              "[AuthContext] Error al actualizar Auth:",
              authUpdateError.message,
            );
            return { error: authUpdateError.message };
          }

          // Si cambió el email, reflejarlo también en la tabla usuarios
          if (authChanges.email) {
            dbChanges.email = authChanges.email;
          }
        }

        // ── Paso 4: Persistir cambios de perfil en la tabla `usuarios` ──
        if (Object.keys(dbChanges).length > 0) {
          dbChanges.updated_at = new Date().toISOString();

          const { error: updateError } = await supabase
            .from("usuarios")
            .update(dbChanges)
            .eq("auth_id", user.id);

          if (updateError) {
            console.error(
              "[AuthContext] Error al actualizar tabla usuarios:",
              updateError.message,
            );
            return { error: updateError.message };
          }
        }

        // ── Paso 5: Reflejar cambios en el estado en memoria ──
        const memoryUpdate = { ...dbChanges };
        if (authChanges.email) memoryUpdate.email = authChanges.email;

        if (dbChanges.id_gerencia) {
          const { data: locData } = await supabase
            .from("localizaciones")
            .select("nombre")
            .eq("id", dbChanges.id_gerencia)
            .single();
          if (locData) {
            memoryUpdate.gerencia = locData.nombre;
          }
        }

        setUser((prev) => ({
          ...prev,
          ...memoryUpdate,
        }));

        console.log(
          "[AuthContext] Perfil actualizado. Campos modificados:",
          Object.keys({ ...dbChanges, ...authChanges }),
        );

        return { success: true };
      } catch (err) {
        console.error("[AuthContext] Error inesperado en updateProfile:", err);
        return { error: "Ocurrió un error inesperado. Intenta de nuevo." };
      } finally {
        setIsLoading(false);
      }
    },
    [user, uploadImage],
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
    updateProfile,
    sendResetEmail,
    resetPassword,
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
