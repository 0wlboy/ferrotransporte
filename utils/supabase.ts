import 'expo-sqlite/localStorage/install';
import { createClient } from '@supabase/supabase-js';

/**
 * URL base de la instancia de Supabase del proyecto.
 * Se utiliza para todas las peticiones REST y de autenticación.
 */
const supabaseUrl = 'https://pmieadnlrhumjefvbibe.supabase.co';

/**
 * Llave pública (anon key) de Supabase.
 * Esta llave es segura para exponerse en el cliente — solo tiene los permisos de RLS.
 */
const supabaseAnonKey = 'sb_publishable_nLbe-JKFlkUhNgEGUR2rFw_5XQComKM';

/**
 * Cliente singleton de Supabase.
 * Configurado con localStorage de expo-sqlite para persistencia nativa en el dispositivo.
 * - autoRefreshToken: renueva automáticamente el token de sesión antes de que expire.
 * - persistSession: guarda la sesión activa en el storage del dispositivo.
 * - detectSessionInUrl: desactivado para aplicaciones nativas (no web).
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: localStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
