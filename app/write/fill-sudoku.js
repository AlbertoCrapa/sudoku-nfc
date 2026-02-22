/**
 * Fill Sudoku Screen
 *
 * Manually fill a 9x9 grid and add to pending list.
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
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
import NumberPad from "../../components/sudoku/NumberPad";
import SudokuGrid from "../../components/sudoku/SudokuGrid";
import { Colors, Spacing, Typography } from "../../constants/app-theme";
import { useWriteBuffer } from "../../context/write-buffer-context";
import { deepCopyGrid, gridToString } from "../../modules/sudoku-engine";

export default function FillSudokuScreen() {
  const router = useRouter();
  const { addPuzzle, getPendingCount } = useWriteBuffer();
  const [grid, setGrid] = useState(
    Array(9)
      .fill(null)
      .map(() => Array(9).fill(0)),
  );
  const [selectedCell, setSelectedCell] = useState(null);

  const handleCellPress = useCallback((row, col) => {
    setSelectedCell({ row, col });
  }, []);

  const handleNumberPress = useCallback(
    (num) => {
      if (!selectedCell) return;

      const { row, col } = selectedCell;
      setGrid((prevGrid) => {
        const newGrid = deepCopyGrid(prevGrid);
        newGrid[row][col] = num;
        return newGrid;
      });
    },
    [selectedCell],
  );

  const handleClear = useCallback(() => {
    if (!selectedCell) return;

    const { row, col } = selectedCell;
    setGrid((prevGrid) => {
      const newGrid = deepCopyGrid(prevGrid);
      newGrid[row][col] = 0;
      return newGrid;
    });
  }, [selectedCell]);

  const handleClearAll = () => {
    Alert.alert(
      "Clear Grid",
      "Are you sure you want to clear the entire grid?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            setGrid(
              Array(9)
                .fill(null)
                .map(() => Array(9).fill(0)),
            );
            setSelectedCell(null);
          },
        },
      ],
    );
  };

  const getFilledCellCount = () => {
    return grid.flat().filter((cell) => cell !== 0).length;
  };

  const handleAddToPending = () => {
    const filledCount = getFilledCellCount();

    if (filledCount === 0) {
      Alert.alert(
        "Empty Grid",
        "Please fill in at least some cells before adding.",
      );
      return;
    }

    const puzzleString = gridToString(grid);
    const result = addPuzzle(puzzleString);

    if (result.success) {
      Alert.alert(
        "Puzzle Added",
        `Added to pending list (${getPendingCount() + 1} total).\n\nAdd another puzzle or go back to write to NFC.`,
        [
          {
            text: "Add Another",
            onPress: () => {
              setGrid(
                Array(9)
                  .fill(null)
                  .map(() => Array(9).fill(0)),
              );
              setSelectedCell(null);
            },
          },
          { text: "Done", onPress: () => router.back() },
        ],
      );
    } else {
      Alert.alert("Error", result.error);
    }
  };

  // Create locked cells mask (all false since user is filling)
  const lockedCells = grid.map((row) => row.map(() => false));
  const notes = Array(9)
    .fill(null)
    .map(() =>
      Array(9)
        .fill(null)
        .map(() => new Set()),
    );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Fill Sudoku</Text>
        <Pressable style={styles.clearButton} onPress={handleClearAll}>
          <Ionicons
            name="trash-outline"
            size={22}
            color={Colors.textSecondary}
          />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Cell Count */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {getFilledCellCount()}/81 cells filled
          </Text>
        </View>

        {/* Grid */}
        <View style={styles.gridContainer}>
          <SudokuGrid
            grid={grid}
            notes={notes}
            lockedCells={lockedCells}
            selectedCell={selectedCell}
            originalGrid={grid}
            onCellPress={handleCellPress}
          />
        </View>

        {/* Number Pad */}
        <NumberPad
          onNumberPress={handleNumberPress}
          onClear={handleClear}
          onPencilToggle={() => {}}
          isPencilMode={false}
        />
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomButton}>
        <Button
          title="Add to Pending List"
          onPress={handleAddToPending}
          disabled={getFilledCellCount() === 0}
          fullWidth
          size="large"
        />
      </View>
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
  clearButton: {
    padding: Spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  statsContainer: {
    paddingHorizontal: Spacing.screenHorizontal,
    marginBottom: Spacing.md,
  },
  statsText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  gridContainer: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  bottomButton: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
});
