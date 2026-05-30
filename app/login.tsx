// nuevo comentario 

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─────────────────────────────────────────────────────────────────────────────
// VALIDACIONES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Expresión regular para validar el formato de un correo electrónico.
 * Exige al menos: [algo]@[algo].[algo]
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Expresión regular para validar la fortaleza de una contraseña.
 * Requiere mínimo 6 caracteres, al menos 1 letra y 1 número.
 */
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pantalla de inicio de sesión.
 *
 * Responsabilidades:
 * - Validar localmente el formato de email y fortaleza de contraseña con regex.
 * - Delegar la autenticación real a `useAuth().signIn`.
 * - Mostrar errores dinámicos del servidor bajo los inputs correspondientes.
 * - Navegar al home tras autenticación exitosa (manejado por el contexto).
 */
export default function Login() {
    // ── Estado del formulario ──
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // ── Estado de errores locales (validación regex) ──
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    // ── Error global del servidor (credenciales incorrectas, etc.) ──
    const [serverError, setServerError] = useState('');

    // ── Contexto de autenticación ──
    const { signIn, isLoading } = useAuth();

    // ───────────────────────────────────────────────────────────────────────
    // VALIDACIÓN LOCAL
    // ───────────────────────────────────────────────────────────────────────

    /**
     * Valida el formulario localmente con las expresiones regulares definidas.
     * Actualiza los estados de error para cada campo de forma independiente.
     *
     * @returns {boolean} `true` si todos los campos son válidos, `false` en caso contrario.
     */
    const validateForm = () => {
        let isValid = true;

        // Validación de email
        if (!email.trim()) {
            setEmailError('El correo electrónico es requerido.');
            isValid = false;
        } else if (!EMAIL_REGEX.test(email.trim())) {
            setEmailError('Ingresa un correo electrónico válido.');
            isValid = false;
        } else {
            setEmailError('');
        }

        // Validación de contraseña
        if (!password) {
            setPasswordError('La contraseña es requerida.');
            isValid = false;
        } else if (!PASSWORD_REGEX.test(password)) {
            setPasswordError('Mínimo 6 caracteres con al menos 1 letra y 1 número.');
            isValid = false;
        } else {
            setPasswordError('');
        }

        return isValid;
    };

    // ───────────────────────────────────────────────────────────────────────
    // MANEJADORES
    // ───────────────────────────────────────────────────────────────────────

    /**
     * Maneja el envío del formulario de inicio de sesión.
     * Primero valida localmente y luego delega al contexto de auth.
     * Los errores del servidor se muestran como error en el campo de correo.
     */
    const handleLogin = async () => {
        // Limpiar error del servidor antes de cada intento
        setServerError('');

        if (!validateForm()) return;

        const { error } = await signIn(email, password);

        if (error) {
            // Mostrar el error del servidor bajo el campo de email
            setEmailError(error);
        }
    };

    // ───────────────────────────────────────────────────────────────────────
    // RENDER
    // ───────────────────────────────────────────────────────────────────────

    return (
        <SafeAreaView style={styles.safeContainer}>
            <StatusBar style="light" backgroundColor="#A10F2D" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    bounces={false}
                >
                    {/* ── Sección de encabezado (fondo carmesí) ── */}
                    <View style={styles.headerContainer}>

                        {/* Logo de la marca */}
                        <View style={styles.logoContainer}>
                            <View style={styles.logoSquare}>
                                <Image
                                    source={require('@/assets/images/ferrominera-logo.png')}
                                    style={styles.logo}
                                    resizeMode="contain"
                                />
                            </View>
                        </View>

                        {/* Título de la pantalla */}
                        <Text style={styles.headerTitle}>Inicio de Sesion</Text>
                    </View>

                    {/* ── Tarjeta del formulario (fondo blanco) ── */}
                    <View style={styles.formCard}>

                        {/* Campo: Correo electrónico */}
                        <Input
                            label="Correo"
                            placeholder="email@email.com"
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                if (emailError) setEmailError('');
                                if (serverError) setServerError('');
                            }}
                            error={emailError}
                            keyboardType="email-address"
                            autoComplete="email"
                            autoCapitalize="none"
                        />

                        {/* Campo: Contraseña */}
                        <Input
                            label="Contraseña"
                            placeholder="****************"
                            value={password}
                            onChangeText={(text) => {
                                setPassword(text);
                                if (passwordError) setPasswordError('');
                            }}
                            error={passwordError}
                            secureTextEntry
                            autoComplete="password"
                        />

                        {/* Link: ¿Olvidaste tu contraseña? */}
                        <TouchableOpacity
                            onPress={() => Alert.alert(
                                'Recuperar contraseña',
                                'Revisa tu correo para recuperar tu contraseña.'
                            )}
                            style={styles.forgotPasswordContainer}
                            activeOpacity={0.6}
                        >
                            <Text style={styles.linkTextNormal}>
                                ¿Olvidaste tu contraseña?{' '}
                                <Text style={styles.linkTextRed}>Haz click aqui</Text>
                            </Text>
                        </TouchableOpacity>

                        {/* Botón de inicio de sesión */}
                        <Button
                            title="Iniciar Sesion"
                            onPress={handleLogin}
                            isLoading={isLoading}
                            containerStyle={styles.submitButton}
                        />

                        {/* Link: ¿No estás registrado? */}
                        <TouchableOpacity
                            onPress={() => router.push('/singIn')}
                            style={styles.registerContainer}
                            activeOpacity={0.6}
                        >
                            <Text style={styles.linkTextNormal}>
                                ¿No estas registrado?{' '}
                                <Text style={styles.linkTextRed}>Haz click aqui</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        backgroundColor: '#A10F2D',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        backgroundColor: '#A10F2D',
    },
    headerContainer: {
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 40 : 60,
        paddingBottom: 35,
    },
    logoContainer: {
        marginBottom: 25,
    },
    logoSquare: {
        width: 68,
        height: 68,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
    },
    logo: {
        width: 56,
        height: 56,
    },
    logoRing: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 3,
        borderColor: '#A10F2D',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 3,
    },
    logoInnerGrid: {
        width: '100%',
        height: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 2,
    },
    logoLeftBar: {
        width: 6,
        height: '80%',
        backgroundColor: '#A10F2D',
        borderRadius: 3,
    },
    logoRightArchContainer: {
        flex: 1,
        height: '80%',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 4,
    },
    logoRightArch: {
        width: '100%',
        height: '100%',
        borderWidth: 3,
        borderColor: '#A10F2D',
        borderLeftWidth: 0,
        borderBottomRightRadius: 10,
        borderTopRightRadius: 10,
        position: 'absolute',
    },
    logoCenterDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#A10F2D',
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    formCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: 24,
        paddingTop: 36,
        paddingBottom: 40,
    },
    forgotPasswordContainer: {
        alignSelf: 'flex-start',
        marginTop: 6,
        marginBottom: 28,
    },
    submitButton: {
        marginTop: 10,
        marginBottom: 24,
    },
    registerContainer: {
        alignSelf: 'center',
        marginTop: 10,
    },
    linkTextNormal: {
        fontSize: 14,
        color: '#2E2E2E',
        fontWeight: '500',
    },
    linkTextRed: {
        color: '#A10F2D',
        fontWeight: '700',
    },
});