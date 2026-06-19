import { AuthProvider } from "@/context/auth-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import * as Linking from "expo-linking";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

/**
 * Configuración de la pantalla de inicio (anchor) del stack de navegación.
 * Se utiliza internamente por expo-router para saber desde dónde iniciar.
 */
export const unstable_settings = {
  anchor: "login",
};

/**
 * RootLayout — Layout raíz de la aplicación.
 *
 * Responsabilidades:
 * - Envuelve toda la app con `AuthProvider` para exponer el contexto de auth globalmente.
 * - Define el tema (dark/light) y todas las rutas del Stack principal.
 * - La pantalla inicial es `login`; tras autenticarse, el contexto navega a `(auth)/(tabs)`.
 */
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  useEffect(() => {
    // 1. Escuchar si la app se abrió mediante un enlace mientras estaba cerrada
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    // 2. Escuchar si la app recibe un enlace estando ya abierta en segundo plano
    const subscription = Linking.addEventListener("url", (event) => {
      handleDeepLink(event.url);
    });

    return () => subscription.remove();
  }, []);

  const handleDeepLink = async (url: string) => {
    console.log("URL Recibida por la app:", url);

    // Parseamos la URL recibida
    const parsed = Linking.parse(url);

    // Si la ruta contiene 'reset-password' o viene un tipo 'recovery' en el hash
    if (url.includes("changePassword") || url.includes("type=recovery")) {
      // Le damos un pequeño respiro al hilo de navegación para evitar conflictos de renderizado
      setTimeout(() => {
        router.replace("/changePassword");
      }, 500);
    }
  };

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          {/* Pantalla de redirección inicial / guard de autenticación */}
          <Stack.Screen name="index" options={{ headerShown: false }} />

          {/* Pantalla de inicio de sesión (sin header) */}
          <Stack.Screen name="login" options={{ headerShown: false }} />

          {/* Pantalla de registro (sin header — usa botón propio) */}
          <Stack.Screen name="singIn" options={{ headerShown: false }} />

          {/* Pantallas autenticadas con tabs */}
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />

          {/* Pantalla de recuperación de contraseña */}
          <Stack.Screen name="resetPassword" options={{ headerShown: false }} />

          {/* Pantalla de cambio de contraseña */}
          <Stack.Screen
            name="changePassword"
            options={{ headerShown: false }}
          />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
