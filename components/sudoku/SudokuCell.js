/**
 * SudokuCell Component
 *
 * Individual cell in the Sudoku grid.
 * Handles display of values, notes, and visual states.
 */

import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Colors, Typography } from "../../constants/app-theme";

/**
 * @param {Object} props
 * @param {number} props.value - Cell value (0 for empty)
 * @param {Set} props.notes - Set of note values
 * @param {boolean} props.isLocked - True if this is an original puzzle cell
 * @param {boolean} props.isSelected - True if cell is selected
 * @param {boolean} props.isHighlighted - True if cell should be highlighted
 * @param {boolean} props.isSameNumber - True if cell has same number as selected
 * @param {boolean} props.isError - True if cell has an error
 * @param {boolean} props.isInSameRow - True if in same row as selected
 * @param {boolean} props.isInSameCol - True if in same column as selected
 * @param {boolean} props.isInSameBox - True if in same 3x3 box as selected
 * @param {number} props.row - Row index
 * @param {number} props.col - Column index
 * @param {number} props.cellSize - Size of the cell
 * @param {function} props.onPress - Press handler
 */
function SudokuCell({
  value,
  notes = new Set(),
  isLocked = false,
  isSelected = false,
  isHighlighted = false,
  isSameNumber = false,
  isError = false,
  isInSameRow = false,
  isInSameCol = false,
  isInSameBox = false,
  row,
  col,
  cellSize,
  onPress,
}) {
  // Determine background color based on state
  const getBackgroundColor = () => {
    if (isError) return Colors.errorBackground;
    if (isSelected) return Colors.selectedCell;
    if (isSameNumber && value !== 0) return Colors.sameNumberHighlight;
    if (isHighlighted) return Colors.highlightedCell;
    // Alternate background for 3x3 box visual distinction
    const boxRow = Math.floor(row / 3);
    const boxCol = Math.floor(col / 3);
    if ((boxRow + boxCol) % 2 === 0) {
      return Colors.cellBackgroundAlt;
    }
    return Colors.cellBackground;
  };

  // Determine text color
  const getTextColor = () => {
    if (isError) return Colors.error;
    if (isLocked) return Colors.numberFixed;
    return Colors.numberUser;
  };

  // Determine border style
  const getBorderStyle = () => {
    const borders = {
      borderTopWidth: row % 3 === 0 ? 2 : 1,
      borderLeftWidth: col % 3 === 0 ? 2 : 1,
      borderBottomWidth: row === 8 ? 2 : 1,
      borderRightWidth: col === 8 ? 2 : 1,
    };

    // Use thicker borders for 3x3 box edges
    if (row % 3 === 0) borders.borderTopColor = Colors.gridBorderThick;
    else borders.borderTopColor = Colors.gridBorderThin;

    if (col % 3 === 0) borders.borderLeftColor = Colors.gridBorderThick;
    else borders.borderLeftColor = Colors.gridBorderThin;

    if (row === 8 || (row + 1) % 3 === 0)
      borders.borderBottomColor = Colors.gridBorderThick;
    else borders.borderBottomColor = Colors.gridBorderThin;

    if (col === 8 || (col + 1) % 3 === 0)
      borders.borderRightColor = Colors.gridBorderThick;
    else borders.borderRightColor = Colors.gridBorderThin;

    return borders;
  };

  // Render notes in a 3x3 mini-grid
  const renderNotes = () => {
    // Defensive check - ensure notes is a valid Set
    const safeNotes = notes instanceof Set ? notes : new Set();
    if (value !== 0 || safeNotes.size === 0) return null;

    const noteSize = cellSize / 3.5;

    return (
      <View style={styles.notesContainer}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <View
            key={num}
            style={[styles.noteCell, { width: noteSize, height: noteSize }]}
          >
            {safeNotes.has(num) && (
              <Text style={[styles.noteText, { fontSize: cellSize / 4.5 }]}>
                {num}
              </Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.cell,
        {
          width: cellSize,
          height: cellSize,
          backgroundColor: getBackgroundColor(),
        },
        getBorderStyle(),
      ]}
    >
      {value !== 0 ? (
        <Text
          style={[
            styles.value,
            {
              color: getTextColor(),
              fontSize: cellSize * 0.55,
              fontWeight: isLocked
                ? Typography.fontWeight.bold
                : Typography.fontWeight.medium,
            },
          ]}
        >
          {value}
        </Text>
      ) : (
        renderNotes()
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    justifyContent: "center",
    alignItems: "center",
    borderColor: Colors.gridBorderThin,
  },
  value: {
    textAlign: "center",
  },
  notesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 1,
  },
  noteCell: {
    justifyContent: "center",
    alignItems: "center",
  },
  noteText: {
    color: Colors.numberNotes,
    textAlign: "center",
  },
});

export default memo(SudokuCell);
