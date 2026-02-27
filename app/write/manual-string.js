/**
 * Manual String Screen
 *
 * Enter an 81-character Sudoku string and add to pending list.
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import {
  stringToGrid,
  validateSudokuString,
} from "../../modules/sudoku-engine";

export default function ManualStringScreen() {
  const router = useRouter();
  const { addPuzzle, getPendingCount } = useWriteBuffer();
  const [inputString, setInputString] = useState("");
  const [previewGrid, setPreviewGrid] = useState(null);

  const handleInputChange = (text) => {
    // Only allow valid characters: 0-9 and .
    const filtered = text.replace(/[^0-9.]/g, "").slice(0, 81);
    setInputString(filtered);

    // Update preview if valid length
    if (filtered.length === 81) {
      try {
        const grid = stringToGrid(filtered);
        setPreviewGrid(grid);
      } catch (e) {
        setPreviewGrid(null);
      }
    } else {
      setPreviewGrid(null);
    }
  };

  const validateInput = () => {
    const validation = validateSudokuString(inputString);
    if (!validation.valid) {
      Alert.alert("Invalid Input", validation.error);
      return false;
    }
    return true;
  };

  const handleAddToPending = () => {
    if (!validateInput()) return;

    // Normalize the string (convert . to 0)
    const normalizedString = inputString.replace(/\./g, "0");

    const result = addPuzzle(normalizedString);

    if (result.success) {
      Alert.alert(
        "Puzzle Added",
        `Added to pending list (${getPendingCount() + 1} total).\n\nAdd another puzzle or go back to write to NFC.`,
        [
          {
            text: "Add Another",
            onPress: () => {
              setInputString("");
              setPreviewGrid(null);
            },
          },
          { text: "Done", onPress: () => router.back() },
        ],
      );
    } else {
      Alert.alert("Error", result.error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Manual String</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Instructions */}
          <View style={styles.instructions}>
            <Text style={styles.instructionText}>
              Enter an 81-character string representing a 9x9 Sudoku grid.
            </Text>
            <Text style={styles.instructionDetail}>
              • Use digits 1-9 for filled cells{"\n"}• Use 0 or . (dot) for
              empty cells{"\n"}• Read left-to-right, top-to-bottom
            </Text>
          </View>

          {/* Input Field */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={inputString}
              onChangeText={handleInputChange}
              placeholder="Enter 81-character Sudoku string..."
              placeholderTextColor={Colors.textMuted}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="numeric"
              maxLength={81}
            />
            <Text style={styles.charCount}>
              {inputString.length}/81 characters
            </Text>
          </View>

          {/* Preview Grid */}
          {previewGrid && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewTitle}>Preview</Text>
              <SudokuGrid
                grid={previewGrid}
                notes={Array(9)
                  .fill(null)
                  .map(() =>
                    Array(9)
                      .fill(null)
                      .map(() => new Set()),
                  )}
                lockedCells={previewGrid.map((row) =>
                  row.map((cell) => cell !== 0),
                )}
                selectedCell={null}
                originalGrid={previewGrid}
                disableErrorChecking={true}
              />
            </View>
          )}
        </ScrollView>

        {/* Bottom Button */}
        <View style={styles.bottomButton}>
          <Button
            title="Add to Pending List"
            onPress={handleAddToPending}
            disabled={inputString.length !== 81}
            fullWidth
            size="large"
          />
        </View>
      </KeyboardAvoidingView>
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
  placeholder: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: Spacing.xxl,
  },
  instructions: {
    marginBottom: Spacing.xl,
  },
  instructionText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  instructionDetail: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: Spacing.xl,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    minHeight: 100,
    textAlignVertical: "top",
    fontFamily: "monospace",
  },
  charCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    textAlign: "right",
    marginTop: Spacing.sm,
  },
  previewContainer: {
    marginBottom: Spacing.xl,
    alignItems: "center",
  },
  previewTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    alignSelf: "flex-start",
  },
  bottomButton: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
});
