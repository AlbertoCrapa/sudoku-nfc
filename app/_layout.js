/**
 * Root Layout
 *
 * Main application layout with navigation and state providers.
 */

import * as NavigationBar from "expo-navigation-bar";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Colors } from "../constants/app-theme";
import { GameProvider } from "../context/game-context";
import { WriteBufferProvider } from "../context/write-buffer-context";

export default function RootLayout() {
  useEffect(() => {
    // Set Android navigation bar and system UI colors
    if (Platform.OS === "android") {
      SystemUI.setBackgroundColorAsync(Colors.background);
      NavigationBar.setBackgroundColorAsync(Colors.background);
      NavigationBar.setButtonStyleAsync("light");
    }
  }, []);

  return (
    <SafeAreaProvider>
      <GameProvider>
        <WriteBufferProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.background },
              animation: "slide_from_right",
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="write/index" />
            <Stack.Screen name="write/manual-string" />
            <Stack.Screen name="write/fill-sudoku" />
            <Stack.Screen name="write/generate-sudoku" />
            <Stack.Screen name="write/pending-list" />
            <Stack.Screen name="play/index" />
            <Stack.Screen name="play/puzzle-list" />
            <Stack.Screen name="play/game" />
          </Stack>
          <StatusBar style="light" />
        </WriteBufferProvider>
      </GameProvider>
    </SafeAreaProvider>
  );
}
