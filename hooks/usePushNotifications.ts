import { useAuth } from "@/context/auth-context";
import { supabase } from "@/utils/supabase";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
  const { user } = useAuth();
  const router = useRouter();
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    if (!user?.id) return;

    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        saveTokenToDatabase(user.id, token);
      }
    });

    // Listener para cuando la app está en primer plano
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notificación recibida (foreground):", notification);
      });

    // Listener para cuando la app está en segundo plano o cerrada
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Respuesta de notificación (background/closed):", response);
        const notification = response.notification;
        console.log(
          "Datos de la notificación:",
          notification.request.content.data,
        );
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user?.id]);
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log("Las notificaciones push requieren un dispositivo físico.");
    return null;
  }

  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("No se concedieron permisos para notificaciones push.");
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.error("Falta el projectId en app.json.");
      return null;
    }

    // El canal de Android debe existir ANTES de obtener el token
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    console.log("Expo Push Token obtenido:", tokenData.data);
    return tokenData.data;
  } catch (error) {
    console.error("Error al obtener Expo Push Token:", error);
    return null;
  }
}

async function saveTokenToDatabase(authId: string, token: string) {
  try {
    const { error } = await supabase
      .from("usuarios")
      .update({ push_token: token })
      .eq("auth_id", authId);

    if (error) {
      console.error(
        "Error al guardar push_token en la base de datos:",
        error.message,
      );
    } else {
      console.log("push_token guardado exitosamente en la base de datos.");
    }
  } catch (err) {
    console.error("Excepción al guardar push_token:", err);
  }
}
