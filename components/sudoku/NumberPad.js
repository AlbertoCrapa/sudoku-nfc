/**
 * NumberPad Component
 *
 * Number input controls for Sudoku gameplay.
 * Includes pencil mode toggle and clear button.
 */

import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  BorderRadius,
  Colors,
  Spacing,
  Typography,
} from "../../constants/app-theme";

/**
 * @param {Object} props
 * @param {function} props.onNumberPress - Called when a number is pressed
 * @param {function} props.onClear - Called when clear is pressed
 * @param {function} props.onPencilToggle - Called when pencil mode is toggled
 * @param {function} props.onUndo - Called when undo is pressed
 * @param {function} props.onRedo - Called when redo is pressed
 * @param {boolean} props.isPencilMode - Whether pencil mode is active
 * @param {boolean} props.canUndo - Whether undo is available
 * @param {boolean} props.canRedo - Whether redo is available
 */
function NumberPad({
  onNumberPress,
  onClear,
  onPencilToggle,
  onUndo,
  onRedo,
  isPencilMode = false,
  canUndo = false,
  canRedo = false,
}) {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <View style={styles.container}>
      {/* Action buttons row */}
      <View style={styles.actionsRow}>
        {/* Pencil Mode Toggle */}
        <Pressable
          style={[
            styles.actionButton,
            isPencilMode && styles.actionButtonActive,
          ]}
          onPress={onPencilToggle}
        >
          <Text style={styles.pencilIcon}>✏️</Text>
          <Text
            style={[
              styles.actionButtonText,
              isPencilMode && styles.actionButtonTextActive,
            ]}
          >
            Pencil (P)
          </Text>
        </Pressable>

        {/* Clear Button */}
        <Pressable style={styles.actionButton} onPress={onClear}>
          <Text style={styles.actionButtonText}>Clear</Text>
        </Pressable>

        {/* Undo/Redo */}
        <View style={styles.undoRedoContainer}>
          <Pressable
            style={[styles.smallButton, !canUndo && styles.buttonDisabled]}
            onPress={onUndo}
            disabled={!canUndo}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={canUndo ? Colors.textPrimary : Colors.textMuted}
            />
          </Pressable>
          <Pressable
            style={[styles.smallButton, !canRedo && styles.buttonDisabled]}
            onPress={onRedo}
            disabled={!canRedo}
          >
            <Ionicons
              name="chevron-forward"
              size={20}
              color={canRedo ? Colors.textPrimary : Colors.textMuted}
            />
          </Pressable>
        </View>
      </View>

      {/* Number pad */}
      <View style={styles.numbersContainer}>
        <View style={styles.numbersRow}>
          {numbers.slice(0, 5).map((num) => (
            <Pressable
              key={num}
              style={({ pressed }) => [
                styles.numberButton,
                pressed && styles.numberButtonPressed,
              ]}
              onPress={() => onNumberPress?.(num)}
            >
              <Text style={styles.numberText}>{num}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.numbersRow}>
          {numbers.slice(5, 9).map((num) => (
            <Pressable
              key={num}
              style={({ pressed }) => [
                styles.numberButton,
                pressed && styles.numberButtonPressed,
              ]}
              onPress={() => onNumberPress?.(num)}
            >
              <Text style={styles.numberText}>{num}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingVertical: Spacing.lg,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.buttonSecondary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.xl,
    minWidth: 120,
  },
  actionButtonActive: {
    backgroundColor: Colors.highlightedCell,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  actionButtonText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
  },
  actionButtonTextActive: {
    color: Colors.textPrimary,
  },
  pencilIcon: {
    fontSize: 14,
    marginRight: Spacing.xs,
  },
  undoRedoContainer: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  smallButton: {
    backgroundColor: Colors.buttonSecondary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  numbersContainer: {
    gap: Spacing.sm,
  },
  numbersRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  numberButton: {
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.buttonSecondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  numberButtonPressed: {
    backgroundColor: Colors.highlightedCell,
    borderColor: Colors.primary,
  },
  numberText: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
});

export default memo(NumberPad);
