/**
 * Main Screen
 *
 * Home screen with Write and Play buttons.
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SettingsModal from "../components/SettingsModal";
import {
  BorderRadius,
  Colors,
  Spacing,
  Typography,
} from "../constants/app-theme";
import { useGame } from "../context/game-context";

export default function MainScreen() {
  const router = useRouter();
  const { clearScannedPuzzles } = useGame();
  const [settingsVisible, setSettingsVisible] = useState(false);

  const handleWritePress = () => {
    router.push("/write");
  };

  const handlePlayPress = () => {
    // Clear any existing scanned puzzles when starting fresh
    clearScannedPuzzles();
    router.push("/play");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            <Text style={styles.titleMain}>Sudoku </Text>
            <Text style={styles.titleAccent}>NFC</Text>
          </Text>
        </View>
        <Pressable
          style={styles.settingsButton}
          onPress={() => setSettingsVisible(true)}
        >
          <Ionicons
            name="settings-outline"
            size={24}
            color={Colors.textPrimary}
          />
        </Pressable>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.buttonsContainer}>
          {/* Write Button */}
          <Pressable
            style={({ pressed }) => [
              styles.mainButton,
              styles.writeButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleWritePress}
          >
            <Ionicons
              name="create-outline"
              size={48}
              color={Colors.textPrimary}
            />
            <Text style={styles.buttonText}>Write</Text>
            <Text style={styles.buttonDescription}>
              Write Sudoku puzzles to NFC tags
            </Text>
          </Pressable>

          {/* Play Button */}
          <Pressable
            style={({ pressed }) => [
              styles.mainButton,
              styles.playButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handlePlayPress}
          >
            <Ionicons
              name="game-controller-outline"
              size={48}
              color={Colors.textPrimary}
            />
            <Text style={styles.buttonText}>Play</Text>
            <Text style={styles.buttonDescription}>
              Scan and play Sudoku from NFC tags
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Tap an NFC tag to read or write Sudoku puzzles
        </Text>
      </View>

      {/* Settings Modal */}
      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.screenHorizontal,
    paddingVertical: Spacing.lg,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSize.title,
    fontWeight: Typography.fontWeight.bold,
  },
  titleMain: {
    color: Colors.textPrimary,
  },
  titleAccent: {
    color: Colors.primary,
  },
  settingsButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.screenHorizontal,
  },
  buttonsContainer: {
    gap: Spacing.xl,
  },
  mainButton: {
    padding: Spacing.xxl,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    borderWidth: 1,
  },
  writeButton: {
    backgroundColor: Colors.surface,
    borderColor: Colors.borderLight,
  },
  playButton: {
    backgroundColor: Colors.buttonPrimary,
    borderColor: Colors.buttonPrimary,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  buttonDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingVertical: Spacing.xxl,
    alignItems: "center",
  },
  footerText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    textAlign: "center",
  },
});
