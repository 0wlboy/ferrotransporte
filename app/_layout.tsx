import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/context/auth-context';

/**
 * Configuración de la pantalla de inicio (anchor) del stack de navegación.
 * Se utiliza internamente por expo-router para saber desde dónde iniciar.
 */
export const unstable_settings = {
    anchor: 'login',
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

    return (
        <AuthProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <Stack>
                    {/* Pantalla de inicio de sesión (sin header) */}
                    <Stack.Screen name="login" options={{ headerShown: false }} />

                    {/* Pantalla de registro (sin header — usa botón propio) */}
                    <Stack.Screen name="singIn" options={{ headerShown: false }} />

                    {/* Pantallas autenticadas con tabs */}
                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                </Stack>
                <StatusBar style="auto" />
            </ThemeProvider>
        </AuthProvider>
    );
}
