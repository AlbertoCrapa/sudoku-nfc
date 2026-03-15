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
  { id: "easy", label: "Easy", percentage: 0, clues: 40 },
  { id: "medium", label: "Medium", percentage: 50, clues: 30 },
  { id: "hard", label: "Hard", percentage: 100, clues: 17 },
  { id: "custom", label: "Custom", percentage: null, clues: null },
];

/**
 * Maps a percentage (0-100) to min/max difficulty and clue count.
 * Interpolates between three anchor points:
 * - 0%: Easy (difficulty 0-0.33, 40 clues)
 * - 50%: Medium (difficulty 0.34-0.66, 30 clues)
 * - 100%: Hard (difficulty 0.66-1.0, 17 clues)
 * @param {number} percentage - Difficulty percentage (0-100)
 * @returns {{ minDiff: number, maxDiff: number, clues: number }}
 */
function percentageToDifficulty(percentage) {
  // Clamp percentage to 0-100
  const p = Math.max(0, Math.min(100, percentage));

  let minDiff, maxDiff, clues;

  if (p <= 50) {
    // Interpolate between Easy (0%) and Medium (50%)
    const t = p / 50; // 0 to 1 within this range
    minDiff = 0 + t * 0.34; // 0 → 0.34
    maxDiff = 0.33 + t * (0.66 - 0.33); // 0.33 → 0.66
    clues = Math.round(40 - t * (40 - 30)); // 40 → 30
  } else {
    // Interpolate between Medium (50%) and Hard (100%)
    const t = (p - 50) / 50; // 0 to 1 within this range
    minDiff = 0.34 + t * (0.66 - 0.34); // 0.34 → 0.66
    maxDiff = 0.66 + t * (1.0 - 0.66); // 0.66 → 1.0
    clues = Math.round(30 - t * (30 - 17)); // 30 → 17
  }

  return { minDiff, maxDiff, clues };
}

export default function GenerateSudokuScreen() {
  const router = useRouter();
  const { addPuzzle, getPendingCount } = useWriteBuffer();

  const [selectedPreset, setSelectedPreset] = useState("medium");
  const [grid, setGrid] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Custom parameters for direct control
  const [customMinDiff, setCustomMinDiff] = useState("0.34");
  const [customMaxDiff, setCustomMaxDiff] = useState("0.66");
  const [customClues, setCustomClues] = useState("30");

  // Get current settings based on preset or custom
  const getCurrentSettings = useCallback(() => {
    if (selectedPreset === "custom") {
      return {
        minDiff: parseFloat(customMinDiff) || 0,
        maxDiff: parseFloat(customMaxDiff) || 1,
        clues: parseInt(customClues, 10) || 30,
      };
    }
    const preset = DIFFICULTY_LEVELS.find((d) => d.id === selectedPreset);
    if (preset) {
      return percentageToDifficulty(preset.percentage);
    }
    return percentageToDifficulty(50);
  }, [selectedPreset, customMinDiff, customMaxDiff, customClues]);

  // Generate puzzle with current settings
  const generateNewPuzzle = useCallback(() => {
    setIsGenerating(true);
    setGrid(null);

    // Use setTimeout to allow UI to update before heavy computation
    setTimeout(() => {
      try {
        const { minDiff, maxDiff, clues } = getCurrentSettings();
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
  }, [getCurrentSettings]);

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

  // Handle custom input changes
  const handleCustomMinDiffChange = (text) => {
    const filtered = text.replace(/[^0-9.]/g, "");
    setCustomMinDiff(filtered);
  };

  const handleCustomMaxDiffChange = (text) => {
    const filtered = text.replace(/[^0-9.]/g, "");
    setCustomMaxDiff(filtered);
  };

  const handleCustomCluesChange = (text) => {
    const filtered = text.replace(/[^0-9]/g, "");
    setCustomClues(filtered);
  };

  // Handle applying custom settings
  const handleApplyCustom = () => {
    // Validate and clamp values
    const minDiff = Math.max(0, Math.min(1, parseFloat(customMinDiff) || 0));
    const maxDiff = Math.max(0, Math.min(1, parseFloat(customMaxDiff) || 1));
    const clues = Math.max(17, Math.min(81, parseInt(customClues, 10) || 30));

    // Update inputs with clamped values
    setCustomMinDiff(minDiff.toFixed(2));
    setCustomMaxDiff(maxDiff.toFixed(2));
    setCustomClues(String(clues));

    // Ensure min <= max
    if (minDiff > maxDiff) {
      setCustomMinDiff(maxDiff.toFixed(2));
    }

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

  // Get current settings for display
  const currentSettings = getCurrentSettings();

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
            {DIFFICULTY_LEVELS.map((level) => (
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

        {/* Custom Parameters Input */}
        {selectedPreset === "custom" && (
          <View style={styles.customContainer}>
            <Text style={styles.sectionLabel}>Custom Parameters</Text>
            <View style={styles.customInputsRow}>
              <View style={styles.customInputGroup}>
                <Text style={styles.customInputLabel}>Min Diff</Text>
                <TextInput
                  style={styles.customInput}
                  value={customMinDiff}
                  onChangeText={handleCustomMinDiffChange}
                  keyboardType="decimal-pad"
                  maxLength={4}
                  selectTextOnFocus
                  editable={!isGenerating}
                  placeholder="0.00"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
              <View style={styles.customInputGroup}>
                <Text style={styles.customInputLabel}>Max Diff</Text>
                <TextInput
                  style={styles.customInput}
                  value={customMaxDiff}
                  onChangeText={handleCustomMaxDiffChange}
                  keyboardType="decimal-pad"
                  maxLength={4}
                  selectTextOnFocus
                  editable={!isGenerating}
                  placeholder="1.00"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
              <View style={styles.customInputGroup}>
                <Text style={styles.customInputLabel}>Clues</Text>
                <TextInput
                  style={styles.customInput}
                  value={customClues}
                  onChangeText={handleCustomCluesChange}
                  keyboardType="numeric"
                  maxLength={2}
                  selectTextOnFocus
                  editable={!isGenerating}
                  placeholder="30"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
              <Button
                title="Apply"
                variant="secondary"
                onPress={handleApplyCustom}
                disabled={isGenerating}
                style={styles.applyButton}
              />
            </View>
            <Text style={styles.customHint}>
              Difficulty: {currentSettings.minDiff.toFixed(2)}-
              {currentSettings.maxDiff.toFixed(2)}, Clues:{" "}
              {currentSettings.clues}
            </Text>
          </View>
        )}

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
      <View style={styles.generateNoteContainer}>
        <Text style={styles.generateNoteText}>
          Generator note: this app usually does not create very hard puzzles.
          For truly hard or extreme sudokus, try sudoku.coach.
        </Text>
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
  customContainer: {
    paddingHorizontal: Spacing.screenHorizontal,
    marginBottom: Spacing.lg,
  },
  customInputsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.sm,
  },
  customInputGroup: {
    flex: 1,
  },
  customInputLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  customInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  customHint: {
    marginTop: Spacing.sm,
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  applyButton: {
    marginLeft: Spacing.xs,
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
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  generateNoteContainer: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: Spacing.lg,
  },
  generateNoteText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    lineHeight: Typography.lineHeight.sm,
  },
  generateButton: {
    flex: 1,
  },
  addButton: {
    flex: 2,
  },
});
