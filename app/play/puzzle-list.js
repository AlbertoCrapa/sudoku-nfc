/**
 * Puzzle List Screen
 *
 * Displays list of scanned puzzles for selection.
 */

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  BackHandler,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SettingsModal from "../../components/SettingsModal";
import {
  BorderRadius,
  Colors,
  Spacing,
  Typography,
} from "../../constants/app-theme";
import { useGame } from "../../context/game-context";
import { stringToGrid } from "../../modules/sudoku-engine";

export default function PuzzleListScreen() {
  const router = useRouter();
  const {
    scannedPuzzles,
    clearScannedPuzzles,
    selectPuzzle,
    startGame,
    gameStates,
  } = useGame();
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Handle back navigation - clear puzzles when going back to main
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        clearScannedPuzzles();
        router.replace("/");
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );
      return () => subscription.remove();
    }, []),
  );

  // If no puzzles, redirect to scan
  useFocusEffect(
    useCallback(() => {
      if (scannedPuzzles.length === 0) {
        router.replace("/play");
      }
    }, [scannedPuzzles]),
  );

  const handlePuzzleSelect = (index) => {
    selectPuzzle(index);
    startGame(scannedPuzzles[index], index);
    router.push("/play/game");
  };

  const handleBack = () => {
    clearScannedPuzzles();
    router.replace("/");
  };

  const getClueCount = (puzzleString) => {
    try {
      const grid = stringToGrid(puzzleString);
      return grid.flat().filter((cell) => cell !== 0).length;
    } catch {
      return 0;
    }
  };

  const getDifficulty = (clueCount) => {
    if (clueCount >= 40) return { label: "Easy", color: Colors.success };
    if (clueCount >= 32) return { label: "Medium", color: Colors.primary };
    if (clueCount >= 25) return { label: "Hard", color: "#f97316" };
    return { label: "Expert", color: Colors.error };
  };

  const renderPuzzleItem = ({ item, index }) => {
    const clueCount = getClueCount(item);
    const difficulty = getDifficulty(clueCount);
    const emptyCells = 81 - clueCount;

    // Check if this puzzle has been started (has saved game state)
    const savedGame = gameStates?.[index];
    const isStarted = !!savedGame;
    const isComplete = savedGame?.isComplete;

    // Calculate progress percentage
    let progress = 0;
    if (savedGame?.currentGrid) {
      const filled = savedGame.currentGrid
        .flat()
        .filter((cell) => cell !== 0).length;
      progress = Math.round(((filled - clueCount) / (81 - clueCount)) * 100);
    }

    return (
      <Pressable
        style={({ pressed }) => [
          styles.puzzleCard,
          pressed && styles.puzzleCardPressed,
        ]}
        onPress={() => handlePuzzleSelect(index)}
      >
        <View style={styles.puzzleInfo}>
          <View style={styles.puzzleHeader}>
            <Text style={styles.puzzleTitle}>Puzzle {index + 1}</Text>
            <View style={styles.badgeRow}>
              {isComplete && (
                <View style={[styles.statusBadge, styles.completeBadge]}>
                  <Ionicons name="checkmark" size={12} color={Colors.success} />
                  <Text style={[styles.statusText, { color: Colors.success }]}>
                    Done
                  </Text>
                </View>
              )}
              {isStarted && !isComplete && (
                <View style={[styles.statusBadge, styles.inProgressBadge]}>
                  <Text style={[styles.statusText, { color: Colors.primary }]}>
                    {progress}%
                  </Text>
                </View>
              )}
              <View
                style={[
                  styles.difficultyBadge,
                  { backgroundColor: `${difficulty.color}20` },
                ]}
              >
                <Text
                  style={[styles.difficultyText, { color: difficulty.color }]}
                >
                  {difficulty.label}
                </Text>
              </View>
            </View>
          </View>
          <Text style={styles.puzzleStats}>
            {clueCount} clues • {emptyCells} cells to fill
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Puzzles</Text>
          <Text style={styles.subtitle}>
            {scannedPuzzles.length} puzzle
            {scannedPuzzles.length !== 1 ? "s" : ""} found
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

      {/* Puzzle List */}
      <FlatList
        data={scannedPuzzles}
        renderItem={renderPuzzleItem}
        keyExtractor={(item, index) => `puzzle-${index}`}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="document-text-outline"
              size={48}
              color={Colors.textMuted}
            />
            <Text style={styles.emptyText}>No puzzles found</Text>
          </View>
        }
      />

      {/* Scan More Button */}
      <View style={styles.footer}>
        <Pressable
          style={styles.scanMoreButton}
          onPress={() => router.push("/play")}
        >
          <Ionicons name="scan-outline" size={20} color={Colors.primary} />
          <Text style={styles.scanMoreText}>Scan Another Tag</Text>
        </Pressable>
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
    alignItems: "center",
    paddingHorizontal: Spacing.screenHorizontal,
    paddingVertical: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.md,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  settingsButton: {
    padding: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  puzzleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  puzzleCardPressed: {
    backgroundColor: Colors.highlightedCell,
    borderColor: Colors.primary,
  },
  puzzleInfo: {
    flex: 1,
  },
  puzzleHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  puzzleTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginRight: Spacing.md,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.xs,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 2,
  },
  completeBadge: {
    backgroundColor: `${Colors.success}20`,
  },
  inProgressBadge: {
    backgroundColor: `${Colors.primary}20`,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  difficultyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  difficultyText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  puzzleStats: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  separator: {
    height: Spacing.md,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xxxl,
  },
  emptyText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textMuted,
    marginTop: Spacing.md,
  },
  footer: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  scanMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  scanMoreText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primary,
  },
});
