/**
 * Generate Sudoku Screen
 *
 * Generate a playable Sudoku puzzle and add to pending list.
 * Includes difficulty presets and custom percentage input.
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../../components/Button";
import SudokuGrid from "../../components/sudoku/SudokuGrid";
import {
  BorderRadius,
  Colors,
  Spacing,
  Typography,
} from "../../constants/app-theme";
import { useWriteBuffer } from "../../context/write-buffer-context";
import { generatePuzzle, gridToString } from "../../modules/sudoku-engine";

// Difficulty presets
// Percentage maps to both difficulty (0-1 range) and affects clue count
const DIFFICULTY_LEVELS = [
  { id: "easy", label: "Easy", percentage: 20, clues: 40 },
  { id: "medium", label: "Medium", percentage: 40, clues: 32 },
  { id: "hard", label: "Hard", percentage: 60, clues: 25 },
  { id: "expert", label: "Expert", percentage: 80, clues: 22 },
  { id: "custom", label: "Custom", percentage: null, clues: null },
];

/**
 * Maps a percentage (0-100) to min/max difficulty and clue count.
 * @param {number} percentage - Difficulty percentage (0-100)
 * @returns {{ minDiff: number, maxDiff: number, clues: number }}
 */
function percentageToDifficulty(percentage) {
  // Clamp percentage to 0-100
  const p = Math.max(0, Math.min(100, percentage));

  // Map percentage to difficulty (0-1 range)
  // 0% = very easy (0.0-0.1), 100% = maximum (1.0-1.0)
  const minDiff = p / 100;
  const maxDiff = Math.min(1.0, minDiff + 0.1);

  // Map percentage to clue count
  // 0% = 45 clues (very easy), 100% = 17 clues (minimum possible unique solution)
  // Linear interpolation: 45 - (45-17) * (p/100) = 45 - 28 * (p/100)
  const clues = Math.round(45 - 28 * (p / 100));

  return { minDiff, maxDiff, clues };
}

export default function GenerateSudokuScreen() {
  const router = useRouter();
  const { addPuzzle, getPendingCount } = useWriteBuffer();

  const [selectedPreset, setSelectedPreset] = useState("medium");
  const [percentage, setPercentage] = useState(40);
  const [percentageInput, setPercentageInput] = useState("40");
  const [grid, setGrid] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate puzzle with current settings
  const generateNewPuzzle = useCallback(() => {
    setIsGenerating(true);
    setGrid(null);

    // Use setTimeout to allow UI to update before heavy computation
    setTimeout(() => {
      try {
        const { minDiff, maxDiff, clues } = percentageToDifficulty(percentage);
        const newGrid = generatePuzzle(minDiff, maxDiff, clues);
        setGrid(newGrid);
      } catch (error) {
        Alert.alert(
          "Generation Error",
          "Failed to generate puzzle. Please try again.",
        );
        console.error("Puzzle generation error:", error);
      } finally {
        setIsGenerating(false);
      }
    }, 100);
  }, [percentage]);

  // Generate initial puzzle on mount
  useEffect(() => {
    generateNewPuzzle();
  }, []);

  // Handle preset selection
  const handlePresetChange = (presetId) => {
    setSelectedPreset(presetId);

    if (presetId !== "custom") {
      const preset = DIFFICULTY_LEVELS.find((d) => d.id === presetId);
      if (preset) {
        setPercentage(preset.percentage);
        setPercentageInput(String(preset.percentage));

        // Generate new puzzle with preset settings
        setIsGenerating(true);
        setGrid(null);
        setTimeout(() => {
          try {
            const { minDiff, maxDiff, clues } = percentageToDifficulty(
              preset.percentage,
            );
            const newGrid = generatePuzzle(minDiff, maxDiff, clues);
            setGrid(newGrid);
          } catch (error) {
            Alert.alert(
              "Generation Error",
              "Failed to generate puzzle. Please try again.",
            );
          } finally {
            setIsGenerating(false);
          }
        }, 100);
      }
    }
  };

  // Handle percentage input change
  const handlePercentageChange = (text) => {
    // Allow only digits
    const filtered = text.replace(/[^0-9]/g, "");
    setPercentageInput(filtered);

    if (filtered === "") return;

    // Parse and clamp
    const value = Math.max(0, Math.min(100, parseInt(filtered, 10) || 0));
    setPercentage(value);

    // Switch to custom preset if value doesn't match any preset
    const matchingPreset = DIFFICULTY_LEVELS.find(
      (d) => d.percentage === value && d.id !== "custom",
    );
    if (matchingPreset) {
      setSelectedPreset(matchingPreset.id);
    } else {
      setSelectedPreset("custom");
    }
  };

  // Handle percentage blur - clamp and update
  const handlePercentageBlur = () => {
    const value = Math.max(
      0,
      Math.min(100, parseInt(percentageInput, 10) || 0),
    );
    setPercentage(value);
    setPercentageInput(String(value));

    // Generate new puzzle if value changed
    if (value !== percentage) {
      generateNewPuzzle();
    }
  };

  // Handle applying custom percentage
  const handleApplyPercentage = () => {
    handlePercentageBlur();
    generateNewPuzzle();
  };

  const getClueCount = () => {
    if (!grid) return 0;
    return grid.flat().filter((cell) => cell !== 0).length;
  };

  const handleAddToPending = () => {
    if (!grid) return;

    const puzzleString = gridToString(grid);
    const result = addPuzzle(puzzleString);

    if (result.success) {
      Alert.alert(
        "Puzzle Added",
        `Added to pending list (${getPendingCount() + 1} total).\n\nGenerate another puzzle or go back to write to NFC.`,
        [
          {
            text: "Generate Another",
            onPress: generateNewPuzzle,
          },
          { text: "Done", onPress: () => router.back() },
        ],
      );
    } else {
      Alert.alert("Error", result.error);
    }
  };

  // Create locked cells and notes for display
  const lockedCells = grid
    ? grid.map((row) => row.map((cell) => cell !== 0))
    : Array(9)
        .fill(null)
        .map(() => Array(9).fill(false));
  const notes = Array(9)
    .fill(null)
    .map(() =>
      Array(9)
        .fill(null)
        .map(() => new Set()),
    );
  const displayGrid =
    grid ||
    Array(9)
      .fill(null)
      .map(() => Array(9).fill(0));

  // Get current difficulty info
  const {
    minDiff,
    maxDiff,
    clues: targetClues,
  } = percentageToDifficulty(percentage);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Generate Sudoku</Text>
        <Pressable
          style={styles.refreshButton}
          onPress={generateNewPuzzle}
          disabled={isGenerating}
        >
          <Ionicons
            name="refresh-outline"
            size={22}
            color={isGenerating ? Colors.textMuted : Colors.textSecondary}
          />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Difficulty Presets */}
        <View style={styles.difficultyContainer}>
          <Text style={styles.sectionLabel}>Difficulty Preset</Text>
          <View style={styles.difficultyButtons}>
            {DIFFICULTY_LEVELS.filter((d) => d.id !== "custom").map((level) => (
              <Pressable
                key={level.id}
                style={[
                  styles.difficultyButton,
                  selectedPreset === level.id && styles.difficultyButtonActive,
                ]}
                onPress={() => handlePresetChange(level.id)}
                disabled={isGenerating}
              >
                <Text
                  style={[
                    styles.difficultyText,
                    selectedPreset === level.id && styles.difficultyTextActive,
                  ]}
                >
                  {level.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Custom Percentage Input */}
        <View style={styles.percentageContainer}>
          <Text style={styles.sectionLabel}>
            Difficulty Percentage (0-100%)
          </Text>
          <View style={styles.percentageRow}>
            <TextInput
              style={styles.percentageInput}
              value={percentageInput}
              onChangeText={handlePercentageChange}
              onBlur={handlePercentageBlur}
              keyboardType="numeric"
              maxLength={3}
              selectTextOnFocus
              editable={!isGenerating}
            />
            <Text style={styles.percentageSymbol}>%</Text>
            <Button
              title="Apply"
              variant="secondary"
              onPress={handleApplyPercentage}
              disabled={isGenerating}
              style={styles.applyButton}
            />
          </View>
          <Text style={styles.percentageHint}>
            {percentage}% → ~{targetClues} clues, difficulty{" "}
            {minDiff.toFixed(2)}-{maxDiff.toFixed(2)}
          </Text>
        </View>

        {/* Puzzle Info */}
        {grid && !isGenerating && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              {getClueCount()} clues • {81 - getClueCount()} cells to fill
            </Text>
          </View>
        )}

        {/* Grid */}
        <View style={styles.gridContainer}>
          {isGenerating ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Generating puzzle...</Text>
            </View>
          ) : (
            <SudokuGrid
              grid={displayGrid}
              notes={notes}
              lockedCells={lockedCells}
              selectedCell={null}
              originalGrid={displayGrid}
              disableErrorChecking={true}
            />
          )}
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomButtons}>
        <Button
          title="Generate New"
          variant="secondary"
          onPress={generateNewPuzzle}
          disabled={isGenerating}
          style={styles.generateButton}
        />
        <Button
          title="Add to Pending"
          onPress={handleAddToPending}
          disabled={!grid || isGenerating}
          style={styles.addButton}
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
  refreshButton: {
    padding: Spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  difficultyContainer: {
    paddingHorizontal: Spacing.screenHorizontal,
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  difficultyButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: "center",
  },
  difficultyButtonActive: {
    backgroundColor: Colors.highlightedCell,
    borderColor: Colors.primary,
  },
  difficultyText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  difficultyTextActive: {
    color: Colors.textPrimary,
  },
  percentageContainer: {
    paddingHorizontal: Spacing.screenHorizontal,
    marginBottom: Spacing.lg,
  },
  percentageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  percentageInput: {
    flex: 1,
    maxWidth: 80,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  percentageSymbol: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  applyButton: {
    marginLeft: "auto",
  },
  percentageHint: {
    marginTop: Spacing.sm,
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  infoContainer: {
    paddingHorizontal: Spacing.screenHorizontal,
    marginBottom: Spacing.md,
  },
  infoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  gridContainer: {
    alignItems: "center",
    marginBottom: Spacing.xl,
    minHeight: 350,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 350,
  },
  loadingText: {
    marginTop: Spacing.lg,
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  bottomButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    paddingHorizontal: Spacing.screenHorizontal,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  generateButton: {
    flex: 1,
  },
  addButton: {
    flex: 2,
  },
});
