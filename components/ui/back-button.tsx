import { Colors } from "@/constants/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, type StyleProp, type ViewStyle } from "react-native";

export interface BackButtonProps {
  onPress?: () => void;
  color?: string;
  size?: number;
  containerStyle?: StyleProp<ViewStyle>;
}

export function BackButton({
  onPress,
  color = Colors.light.tint,
  size = 22,
  containerStyle,
}: BackButtonProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.backButton, containerStyle]}
      onPress={handlePress}
      activeOpacity={0.8}
      accessibilityLabel="Volver"
      accessibilityRole="button"
    >
      <MaterialCommunityIcons
        name="arrow-left"
        size={size}
        color={color}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
