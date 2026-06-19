import { useAuth } from "@/context/auth-context";
import { Redirect } from "expo-router";
import React from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { Colors } from "@/constants/theme";

export default function Index() {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/(auth)/home" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
});
