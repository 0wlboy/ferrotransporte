import { CarProvider } from "@/context/car-context";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Tabs, Redirect } from "expo-router";
import React from "react";
import { useAuth } from "@/context/auth-context";

export default function TabLayout() {
  const { isAuthenticated, isInitializing } = useAuth();
  usePushNotifications();

  if (isInitializing) {
    return null; // O un indicador de carga si se prefiere
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <CarProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
        }}
      >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="edit-profile"
        options={{
          title: "Editar Perfil",
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      />

      <Tabs.Screen
        name="record"
        options={{
          title: "Historial de Viajes",
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      />

      {/* Pantallas exclusivas de pasajeros */}
      <Tabs.Screen
        name="petition"
        options={{
          title: "Petición",
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      />
        {/* Pantallas exclusivas de conductor */}
        <Tabs.Screen
          name="inbox"
          options={{
            title: "Buzon de Entradas",
            headerShown: false,
            tabBarStyle: { display: "none" },
          }}
        />
        <Tabs.Screen
          name="edit-car"
          options={{
            title: "Editar Vehiculo",
            headerShown: false,
            tabBarStyle: { display: "none" },
          }}
        />
      </Tabs>
    </CarProvider>
  );
}
