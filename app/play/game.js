/**
 * Game Screen
 *
 * Main Sudoku gameplay screen.
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../../components/Button";
import GameTimer from "../../components/GameTimer";
import SettingsModal from "../../components/SettingsModal";
import NumberPad from "../../components/sudoku/NumberPad";
import SudokuGrid from "../../components/sudoku/SudokuGrid";
import {
  BorderRadius,
  Colors,
  Spacing,
  Typography,
} from "../../constants/app-theme";
import { useGame } from "../../context/game-context";
import { isGridComplete, isValidSolution } from "../../modules/sudoku-engine";

export default function GameScreen() {
  const router = useRouter();
  const {
    currentGame,
    currentPuzzleIndex,
    scannedPuzzles,
    isPencilMode,
    errorMode,
    showTimer,
    selectCell,
    updateCell,
    toggleNote,
    clearCell,
    resetPuzzle,
    togglePencilMode,
    markComplete,
  } = useGame();

  const [settingsVisible, setSettingsVisible] = useState(false);

  // Redirect if no game
  useEffect(() => {
    if (!currentGame) {
      router.replace("/play/puzzle-list");
    }
  }, [currentGame]);

  // Check for completion
  useEffect(() => {
    if (currentGame?.currentGrid && !currentGame.isComplete) {
      const grid = currentGame.currentGrid;
      if (isGridComplete(grid)) {
        if (isValidSolution(grid)) {
          markComplete();
          Alert.alert("Congratulations!", "You solved the puzzle!", [
            { text: "OK" },
          ]);
        }
      }
    }
  }, [currentGame?.currentGrid]);

  const handleCellPress = useCallback(
    (row, col) => {
      selectCell({ row, col });
    },
    [selectCell],
  );

  const handleNumberPress = useCallback(
    (num) => {
      if (!currentGame?.selectedCell) return;

      const { row, col } = currentGame.selectedCell;

      // Don't allow editing locked cells
      if (currentGame.lockedCells?.[row]?.[col]) return;

      if (isPencilMode) {
        // Toggle note
        toggleNote(row, col, num);
      } else {
        // Place number (overwrites existing)
        updateCell(row, col, num);
      }
    },
    [currentGame, isPencilMode, updateCell, toggleNote],
  );

  const handleClear = useCallback(() => {
    if (!currentGame?.selectedCell) return;

    const { row, col } = currentGame.selectedCell;

    // Don't allow clearing locked cells
    if (currentGame.lockedCells?.[row]?.[col]) return;

    clearCell(row, col);
  }, [currentGame, clearCell]);

  const handleReset = () => {
    Alert.alert(
      "Reset Puzzle",
      "Are you sure you want to reset this puzzle? All progress will be lost.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: resetPuzzle,
        },
      ],
    );
  };

  const handleVerify = () => {
    if (!currentGame?.currentGrid) return;

    const grid = currentGame.currentGrid;

    if (!isGridComplete(grid)) {
      // Count empty cells
      const emptyCells = grid.flat().filter((cell) => cell === 0).length;
      Alert.alert(
        "Incomplete",
        `You still have ${emptyCells} empty cell${emptyCells !== 1 ? "s" : ""} to fill.`,
      );
      return;
    }

    if (isValidSolution(grid)) {
      markComplete();
      Alert.alert("Congratulations!", "Your solution is correct!", [
        { text: "OK" },
      ]);
    } else {
      Alert.alert("Incorrect", "Your solution has some errors. Keep trying!", [
        { text: "OK" },
      ]);
    }
  };

  // Calculate progress
  const progress = useMemo(() => {
    if (!currentGame?.currentGrid || !currentGame?.originalGrid) return 0;
    const total = 81;
    const filled = currentGame.currentGrid
      .flat()
      .filter((cell) => cell !== 0).length;
    const original = currentGame.originalGrid
      .flat()
      .filter((cell) => cell !== 0).length;
    const remaining = total - original;
    if (remaining === 0) return 100;
    return (((filled - original) / remaining) * 100).toFixed(1);
  }, [currentGame]);

  if (!currentGame || !currentGame.currentGrid) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>
            <Text style={styles.titleMain}>Sudoku </Text>
            <Text style={styles.titleAccent}>NFC</Text>
          </Text>
          <View style={styles.statsRow}>
            <Text style={styles.puzzleNumber}>
              PZ {(currentPuzzleIndex ?? 0) + 1}/{scannedPuzzles?.length ?? 0}
            </Text>
            <View style={styles.progressBadge}>
              <Text style={styles.progressText}>{progress}%</Text>
            </View>
          </View>
        </View>

        {showTimer && <GameTimer elapsedMs={currentGame.elapsedTime ?? 0} />}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Grid */}
        <View style={styles.gridContainer}>
          <SudokuGrid
            grid={currentGame.currentGrid}
            notes={currentGame.notes}
            lockedCells={currentGame.lockedCells}
            selectedCell={currentGame.selectedCell}
            originalGrid={currentGame.originalGrid}
            onCellPress={handleCellPress}
          />
        </View>

        {/* Number Pad */}
        <NumberPad
          onNumberPress={handleNumberPress}
          onClear={handleClear}
          onPencilToggle={togglePencilMode}
          isPencilMode={isPencilMode}
        />

        {/* Verify Button */}
        <View style={styles.verifyContainer}>
          <Button
            title="Verify Solution"
            onPress={handleVerify}
            fullWidth
            size="large"
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <Pressable style={styles.actionButton} onPress={handleReset}>
            <Ionicons
              name="refresh-outline"
              size={20}
              color={Colors.textSecondary}
            />
            <Text style={styles.actionText}>Reset</Text>
          </Pressable>
          <Pressable
            style={styles.actionButton}
            onPress={() => setSettingsVisible(true)}
          >
            <Ionicons
              name="settings-outline"
              size={20}
              color={Colors.textSecondary}
            />
            <Text style={styles.actionText}>Settings</Text>
          </Pressable>
        </View>

        {/* Completed Overlay */}
        {currentGame.isComplete && (
          <View style={styles.completeBanner}>
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={Colors.success}
            />
            <Text style={styles.completeText}>Puzzle Completed!</Text>
          </View>
        )}
      </ScrollView>

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
    marginRight: Spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },
  titleMain: {
    color: Colors.textPrimary,
  },
  titleAccent: {
    color: Colors.primary,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: Spacing.sm,
  },
  puzzleNumber: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  progressBadge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  progressText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  gridContainer: {
    alignItems: "center",
    marginVertical: Spacing.lg,
  },
  verifyContainer: {
    paddingHorizontal: Spacing.screenHorizontal,
    marginTop: Spacing.lg,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.xxl,
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.screenHorizontal,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    padding: Spacing.md,
  },
  actionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  completeBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.successBackground,
    marginHorizontal: Spacing.screenHorizontal,
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  completeText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.success,
  },
});
