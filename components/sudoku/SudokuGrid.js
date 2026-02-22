/**
 * SudokuGrid Component
 *
 * Renders the complete 9x9 Sudoku grid.
 * Handles cell selection and visual highlighting.
 */

import { memo, useMemo } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { BorderRadius, Colors, Spacing } from "../../constants/app-theme";
import { ERROR_MODES, useGame } from "../../context/game-context";
import {
  findConflicts,
  getBoxIndex,
  isCorrectValue,
} from "../../modules/sudoku-engine";
import SudokuCell from "./SudokuCell";

const { width: screenWidth } = Dimensions.get("window");

/**
 * @param {Object} props
 * @param {number[][]} props.grid - 9x9 grid of values
 * @param {Set[][]} props.notes - 9x9 grid of note Sets
 * @param {boolean[][]} props.lockedCells - 9x9 grid of locked cell flags
 * @param {Object|null} props.selectedCell - { row, col } or null
 * @param {number[][]} props.originalGrid - Original puzzle for solution verification
 * @param {function} props.onCellPress - Cell press handler
 */
function SudokuGrid({
  grid,
  notes,
  lockedCells,
  selectedCell,
  originalGrid,
  onCellPress,
}) {
  const { errorMode } = useGame();

  // Calculate cell size based on screen width
  const gridPadding = Spacing.screenHorizontal * 2;
  const availableWidth = screenWidth - gridPadding;
  const cellSize = Math.floor(availableWidth / 9);
  const gridWidth = cellSize * 9;

  // Compute error cells based on error mode
  const errorCells = useMemo(() => {
    const errors = new Set();

    if (errorMode === ERROR_MODES.NONE) {
      return errors;
    }

    if (errorMode === ERROR_MODES.CONFLICTS) {
      // Find all conflicts in the grid
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          const value = grid[row][col];
          if (value !== 0 && !lockedCells[row][col]) {
            const conflicts = findConflicts(grid, row, col, value);
            if (conflicts.length > 0) {
              errors.add(`${row},${col}`);
              conflicts.forEach((c) => errors.add(`${c.row},${c.col}`));
            }
          }
        }
      }
    } else if (errorMode === ERROR_MODES.VERIFIED && originalGrid) {
      // Only highlight cells with incorrect values
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          const value = grid[row][col];
          if (value !== 0 && !lockedCells[row][col]) {
            if (!isCorrectValue(originalGrid, row, col, value)) {
              errors.add(`${row},${col}`);
            }
          }
        }
      }
    }

    return errors;
  }, [grid, lockedCells, originalGrid, errorMode]);

  // Helper to check if cell should be highlighted
  const getCellState = (row, col) => {
    const isSelected = selectedCell?.row === row && selectedCell?.col === col;
    const selectedValue = selectedCell
      ? grid[selectedCell.row][selectedCell.col]
      : 0;
    const cellValue = grid[row][col];

    // Check if same number as selected (for highlighting)
    const isSameNumber =
      selectedValue !== 0 && cellValue === selectedValue && !isSelected;

    // Check if in same row, column, or box as selected
    const isInSameRow = selectedCell?.row === row && !isSelected;
    const isInSameCol = selectedCell?.col === col && !isSelected;
    const isInSameBox = selectedCell
      ? getBoxIndex(selectedCell.row, selectedCell.col) ===
          getBoxIndex(row, col) && !isSelected
      : false;

    // Cell is highlighted if in same row/col/box
    const isHighlighted = isInSameRow || isInSameCol || isInSameBox;

    // Check for errors
    const isError = errorCells.has(`${row},${col}`);

    return {
      isSelected,
      isHighlighted,
      isSameNumber,
      isError,
      isInSameRow,
      isInSameCol,
      isInSameBox,
    };
  };

  return (
    <View style={[styles.container, { width: gridWidth }]}>
      <View style={styles.grid}>
        {grid.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((value, colIndex) => {
              const cellState = getCellState(rowIndex, colIndex);
              const cellNotes = notes?.[rowIndex]?.[colIndex] || new Set();
              const isLocked = lockedCells?.[rowIndex]?.[colIndex] || false;

              return (
                <SudokuCell
                  key={`${rowIndex}-${colIndex}`}
                  value={value}
                  notes={cellNotes}
                  isLocked={isLocked}
                  row={rowIndex}
                  col={colIndex}
                  cellSize={cellSize}
                  onPress={() => onCellPress?.(rowIndex, colIndex)}
                  {...cellState}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    backgroundColor: Colors.gridBorderThick,
  },
  grid: {
    backgroundColor: Colors.gridBorderThin,
  },
  row: {
    flexDirection: "row",
  },
});

export default memo(SudokuGrid);
