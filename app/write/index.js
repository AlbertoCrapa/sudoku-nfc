/**
 * Write Menu Screen
 *
 * Options for writing Sudoku to NFC tags.
 * Shows pending puzzle count and allows viewing/writing the buffer.
 */

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../../components/Button";
import SettingsModal from "../../components/SettingsModal";
import {
  BorderRadius,
  Colors,
  Spacing,
  Typography,
} from "../../constants/app-theme";
import { useWriteBuffer } from "../../context/write-buffer-context";

export default function WriteMenuScreen() {
  const router = useRouter();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const { pendingPuzzles, getTotalBytes, clearAllPuzzles } = useWriteBuffer();
  const [, forceUpdate] = useState(0);

  // Force re-render when returning to this screen to show updated count
  useFocusEffect(
    useCallback(() => {
      forceUpdate((n) => n + 1);
    }, []),
  );

  const menuOptions = [
    {
      id: "manual",
      title: "Manual String",
      description: "Enter an 81-character Sudoku string",
      icon: "text-outline",
      route: "/write/manual-string",
    },
    {
      id: "fill",
      title: "Fill Sudoku",
      description: "Manually fill a 9x9 grid",
      icon: "grid-outline",
      route: "/write/fill-sudoku",
    },
    {
      id: "generate",
      title: "Generate Sudoku",
      description: "Auto-generate a playable puzzle",
      icon: "shuffle-outline",
      route: "/write/generate-sudoku",
    },
  ];

  const handleOptionPress = (route) => {
    router.push(route);
  };

  const handleViewPending = () => {
    router.push("/write/pending-list");
  };

  const handleBack = () => {
    // Clear pending puzzles when leaving write flow
    clearAllPuzzles();
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Write to NFC</Text>
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

      {/* Pending Puzzles Banner */}
      {pendingPuzzles.length > 0 && (
        <Pressable style={styles.pendingBanner} onPress={handleViewPending}>
          <View style={styles.pendingInfo}>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingCount}>{pendingPuzzles.length}</Text>
            </View>
            <View>
              <Text style={styles.pendingTitle}>Pending Puzzles</Text>
              <Text style={styles.pendingSubtitle}>
                {getTotalBytes()} bytes ready to write
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
        </Pressable>
      )}

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.subtitle}>Choose how to create your puzzle</Text>

        <View style={styles.optionsContainer}>
          {menuOptions.map((option) => (
            <Pressable
              key={option.id}
              style={({ pressed }) => [
                styles.optionCard,
                pressed && styles.optionCardPressed,
              ]}
              onPress={() => handleOptionPress(option.route)}
            >
              <View style={styles.optionIcon}>
                <Ionicons name={option.icon} size={32} color={Colors.primary} />
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>
                  {option.description}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors.textMuted}
              />
            </Pressable>
          ))}
        </View>
      </View>

      {/* Write Button */}
      {pendingPuzzles.length > 0 && (
        <View style={styles.bottomButton}>
          <Button
            title={`Write ${pendingPuzzles.length} Puzzle${pendingPuzzles.length !== 1 ? "s" : ""} to NFC`}
            onPress={handleViewPending}
            fullWidth
          />
        </View>
      )}

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
    alignItems: "center",
    paddingHorizontal: Spacing.screenHorizontal,
    paddingVertical: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.md,
  },
  title: {
    flex: 1,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  settingsButton: {
    padding: Spacing.sm,
  },
  pendingBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: Spacing.screenHorizontal,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: `${Colors.primary}15`,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  pendingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  pendingBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  pendingCount: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.surface,
  },
  pendingTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  pendingSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: Spacing.md,
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  optionsContainer: {
    gap: Spacing.md,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  optionCardPressed: {
    backgroundColor: Colors.highlightedCell,
    borderColor: Colors.primary,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: `${Colors.primary}20`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.lg,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  optionDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  bottomButton: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
});
