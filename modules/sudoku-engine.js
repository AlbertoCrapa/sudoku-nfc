/**
 * Sudoku Engine Module
 *
 * Core functionality for generating, solving, and validating Sudoku puzzles.
 * Provides utilities for string/grid conversion, conflict detection, and puzzle generation.
 */

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Converts an 81-character string into a 9x9 matrix.
 * Accepts digits 0-9 where 0 represents empty cells.
 * Also accepts '.' as empty cell representation.
 * @param {string} sudokuString - 81 character string
 * @returns {number[][]} 9x9 matrix
 * @throws {Error} If input is invalid
 */
export function stringToGrid(sudokuString) {
  if (!sudokuString || typeof sudokuString !== "string") {
    throw new Error("Sudoku string must be a valid string.");
  }

  if (sudokuString.length !== 81) {
    throw new Error(
      `Sudoku string must be exactly 81 characters long. Got ${sudokuString.length}.`,
    );
  }

  // Normalize: replace '.' with '0'
  const normalized = sudokuString.replace(/\./g, "0");

  // Validate characters
  if (!/^[0-9]{81}$/.test(normalized)) {
    throw new Error(
      'Sudoku string must contain only digits 0-9 or "." for empty cells.',
    );
  }

  const grid = [];
  for (let i = 0; i < 9; i++) {
    const rowStart = i * 9;
    const rowString = normalized.substring(rowStart, rowStart + 9);
    const row = Array.from(rowString, (char) => {
      const num = parseInt(char, 10);
      // Defensive: ensure we always return a valid number
      return isNaN(num) ? 0 : Math.max(0, Math.min(9, num));
    });
    grid.push(row);
  }

  return grid;
}

/**
 * Safe version of stringToGrid that returns null instead of throwing.
 * Useful when parsing potentially malformed data.
 * @param {string} sudokuString - 81 character string
 * @returns {number[][]|null} 9x9 matrix or null if invalid
 */
export function safeStringToGrid(sudokuString) {
  try {
    return stringToGrid(sudokuString);
  } catch (error) {
    console.warn("safeStringToGrid: Invalid input -", error.message);
    return null;
  }
}

/**
 * Creates an empty 9x9 grid with all zeros.
 * @returns {number[][]} Empty 9x9 matrix
 */
export function createEmptyGrid() {
  return Array(9)
    .fill(null)
    .map(() => Array(9).fill(0));
}

/**
 * Creates an empty notes structure for a 9x9 grid.
 * @returns {Set[][]} 9x9 array of empty Sets
 */
export function createEmptyNotes() {
  return Array(9)
    .fill(null)
    .map(() =>
      Array(9)
        .fill(null)
        .map(() => new Set()),
    );
}

/**
 * Creates a locked cells mask from a grid.
 * @param {number[][]} grid - 9x9 matrix
 * @returns {boolean[][]} 9x9 matrix of booleans (true = locked/filled)
 */
export function createLockedCellsMask(grid) {
  if (!grid || !Array.isArray(grid) || grid.length !== 9) {
    return Array(9)
      .fill(null)
      .map(() => Array(9).fill(false));
  }
  return grid.map((row) =>
    Array.isArray(row)
      ? row.map((cell) => cell !== 0 && cell != null)
      : Array(9).fill(false),
  );
}

/**
 * Converts a 9x9 grid matrix into an 81-character string.
 * @param {number[][]} grid - 9x9 matrix
 * @returns {string} 81 character string
 */
export function gridToString(grid) {
  if (!grid || !Array.isArray(grid) || grid.length !== 9) {
    throw new Error("Grid must be a 9x9 matrix.");
  }

  // Ensure all values are valid and convert to string
  const values = [];
  for (let r = 0; r < 9; r++) {
    const row = grid[r];
    if (!Array.isArray(row) || row.length !== 9) {
      throw new Error(`Row ${r} is invalid.`);
    }
    for (let c = 0; c < 9; c++) {
      const val = row[c];
      // Ensure valid digit 0-9
      const num =
        typeof val === "number" && !isNaN(val)
          ? Math.max(0, Math.min(9, Math.floor(val)))
          : 0;
      values.push(num);
    }
  }

  return values.join("");
}

/**
 * Creates a deep copy of a 9x9 grid with defensive validation.
 * @param {number[][]} grid - 9x9 matrix
 * @returns {number[][]} Deep copy of the grid
 */
export function deepCopyGrid(grid) {
  if (!grid || !Array.isArray(grid)) {
    return createEmptyGrid();
  }

  return Array(9)
    .fill(null)
    .map((_, r) => {
      const row = grid[r];
      if (!Array.isArray(row)) {
        return Array(9).fill(0);
      }
      return Array(9)
        .fill(null)
        .map((_, c) => {
          const val = row[c];
          return typeof val === "number" && !isNaN(val) ? val : 0;
        });
    });
}

/**
 * Returns the 3x3 box index (0-8) for a given cell.
 * @param {number} row - Row index (0-8)
 * @param {number} col - Column index (0-8)
 * @returns {number} Box index (0-8)
 */
export function getBoxIndex(row, col) {
  return Math.floor(row / 3) * 3 + Math.floor(col / 3);
}

/**
 * Shuffles an array in place using Fisher-Yates algorithm.
 * @param {any[]} array - Array to shuffle
 * @returns {any[]} Shuffled array
 */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates if a Sudoku string is properly formatted.
 * @param {string} sudokuString - String to validate
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateSudokuString(sudokuString) {
  if (!sudokuString) {
    return { valid: false, error: "Empty string provided." };
  }

  if (sudokuString.length !== 81) {
    return {
      valid: false,
      error: `Invalid length: ${sudokuString.length}. Expected 81 characters.`,
    };
  }

  // Allow 0-9 and '.' for empty cells
  const normalized = sudokuString.replace(/\./g, "0");
  if (!/^[0-9]{81}$/.test(normalized)) {
    return {
      valid: false,
      error:
        'String contains invalid characters. Use only 0-9 or "." for empty cells.',
    };
  }

  return { valid: true };
}

/**
 * Gets all possible values for a cell based on row, column, and box constraints.
 * Includes defensive boundary checks.
 * @param {number[][]} grid - 9x9 matrix
 * @param {number} row - Row index
 * @param {number} col - Column index
 * @returns {number[]} Array of possible values (1-9)
 */
export function getPossibleValues(grid, row, col) {
  // Boundary checks
  if (
    !grid ||
    !Array.isArray(grid) ||
    row < 0 ||
    row >= 9 ||
    col < 0 ||
    col >= 9
  ) {
    return [];
  }

  const rowArr = grid[row];
  if (!Array.isArray(rowArr)) {
    return [];
  }

  if (rowArr[col] !== 0) {
    return [];
  }

  const used = new Set();

  // Check row
  for (let c = 0; c < 9; c++) {
    const val = rowArr[c];
    if (typeof val === "number") used.add(val);
  }

  // Check column
  for (let r = 0; r < 9; r++) {
    const rArr = grid[r];
    if (Array.isArray(rArr)) {
      const val = rArr[col];
      if (typeof val === "number") used.add(val);
    }
  }

  // Check 3x3 box
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let r = startRow; r < startRow + 3; r++) {
    const rArr = grid[r];
    if (!Array.isArray(rArr)) continue;
    for (let c = startCol; c < startCol + 3; c++) {
      const val = rArr[c];
      if (typeof val === "number") used.add(val);
    }
  }

  const possible = [];
  for (let num = 1; num <= 9; num++) {
    if (!used.has(num)) {
      possible.push(num);
    }
  }

  return possible;
}

/**
 * Safely gets a cell value from a grid with boundary checks.
 * @param {number[][]} grid - 9x9 matrix
 * @param {number} row - Row index
 * @param {number} col - Column index
 * @returns {number} Cell value or 0 if invalid
 */
function safeGetCell(grid, row, col) {
  if (
    !grid ||
    !Array.isArray(grid) ||
    row < 0 ||
    row >= 9 ||
    col < 0 ||
    col >= 9
  ) {
    return 0;
  }
  const rowArr = grid[row];
  if (!Array.isArray(rowArr) || col < 0 || col >= rowArr.length) {
    return 0;
  }
  const val = rowArr[col];
  return typeof val === "number" && !isNaN(val) ? val : 0;
}

/**
 * Finds all cells that conflict with a value at a given position.
 * Includes defensive boundary checks.
 * @param {number[][]} grid - 9x9 matrix
 * @param {number} row - Row index
 * @param {number} col - Column index
 * @param {number} value - Value to check (1-9)
 * @returns {Array<{row: number, col: number}>} Array of conflicting cell positions
 */
export function findConflicts(grid, row, col, value) {
  // Boundary and value checks
  if (!grid || !Array.isArray(grid) || value === 0 || value == null) {
    return [];
  }
  if (row < 0 || row >= 9 || col < 0 || col >= 9) {
    return [];
  }

  const conflicts = [];

  // Check row
  for (let c = 0; c < 9; c++) {
    if (c !== col && safeGetCell(grid, row, c) === value) {
      conflicts.push({ row, col: c });
    }
  }

  // Check column
  for (let r = 0; r < 9; r++) {
    if (r !== row && safeGetCell(grid, r, col) === value) {
      conflicts.push({ row: r, col });
    }
  }

  // Check 3x3 box
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let r = startRow; r < startRow + 3; r++) {
    for (let c = startCol; c < startCol + 3; c++) {
      if ((r !== row || c !== col) && safeGetCell(grid, r, c) === value) {
        conflicts.push({ row: r, col: c });
      }
    }
  }

  return conflicts;
}

/**
 * Checks if a value placement causes any conflicts.
 * @param {number[][]} grid - 9x9 matrix
 * @param {number} row - Row index
 * @param {number} col - Column index
 * @param {number} value - Value to check
 * @returns {boolean} True if there are conflicts
 */
export function hasConflicts(grid, row, col, value) {
  return findConflicts(grid, row, col, value).length > 0;
}

/**
 * Validates if a completed Sudoku grid is a valid solution.
 * @param {number[][]} grid - 9x9 matrix
 * @returns {boolean} True if the solution is valid
 */
export function isValidSolution(grid) {
  // Check for any zeros (incomplete)
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) {
        return false;
      }
    }
  }

  // Check rows
  for (let r = 0; r < 9; r++) {
    const rowSet = new Set(grid[r]);
    if (rowSet.size !== 9) {
      return false;
    }
  }

  // Check columns
  for (let c = 0; c < 9; c++) {
    const colSet = new Set();
    for (let r = 0; r < 9; r++) {
      colSet.add(grid[r][c]);
    }
    if (colSet.size !== 9) {
      return false;
    }
  }

  // Check 3x3 boxes
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const boxSet = new Set();
      const startRow = boxRow * 3;
      const startCol = boxCol * 3;
      for (let r = startRow; r < startRow + 3; r++) {
        for (let c = startCol; c < startCol + 3; c++) {
          boxSet.add(grid[r][c]);
        }
      }
      if (boxSet.size !== 9) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Checks if a grid is complete (no empty cells).
 * @param {number[][]} grid - 9x9 matrix
 * @returns {boolean} True if complete
 */
export function isGridComplete(grid) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) {
        return false;
      }
    }
  }
  return true;
}

// ============================================================================
// SOLVER FUNCTIONS
// ============================================================================

/**
 * Solves a Sudoku grid using randomized backtracking.
 * Modifies the grid in place.
 * @param {number[][]} grid - 9x9 matrix
 * @returns {boolean} True if solved
 */
function solveGridBacktracking(grid) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) {
        const possibleNums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        shuffle(possibleNums);

        for (const num of possibleNums) {
          // Check if valid
          let isValid = true;

          // Row check
          if (grid[r].includes(num)) {
            isValid = false;
          }

          // Column check
          if (isValid) {
            for (let i = 0; i < 9; i++) {
              if (grid[i][c] === num) {
                isValid = false;
                break;
              }
            }
          }

          // Box check
          if (isValid) {
            const startRow = Math.floor(r / 3) * 3;
            const startCol = Math.floor(c / 3) * 3;
            outer: for (
              let rowBox = startRow;
              rowBox < startRow + 3;
              rowBox++
            ) {
              for (let colBox = startCol; colBox < startCol + 3; colBox++) {
                if (grid[rowBox][colBox] === num) {
                  isValid = false;
                  break outer;
                }
              }
            }
          }

          if (isValid) {
            grid[r][c] = num;
            if (solveGridBacktracking(grid)) {
              return true;
            }
            grid[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

/**
 * Generates a complete, valid Sudoku solution.
 * @returns {number[][]} Complete 9x9 solved grid
 */
export function generateSolution() {
  const grid = Array(9)
    .fill(null)
    .map(() => Array(9).fill(0));
  solveGridBacktracking(grid);
  return grid;
}

/**
 * Solves a puzzle using only singles techniques (no guessing).
 * Returns the difficulty score or error codes.
 * @param {number[][]} puzzle - 9x9 matrix
 * @param {boolean} returnDifficulty - If true, return difficulty score
 * @returns {number|number[][]} Difficulty score or solved grid
 */
export function solveWithSingles(puzzle, returnDifficulty = false) {
  const grid = deepCopyGrid(puzzle);
  const initialEmptyCells = grid.flat().filter((x) => x === 0).length;

  if (initialEmptyCells === 0) {
    return returnDifficulty ? 0.0 : grid;
  }

  // Initialize possibilities
  const possibilities = Array(9)
    .fill(null)
    .map(() =>
      Array(9)
        .fill(null)
        .map(() => new Set()),
    );

  let emptyCellsCount = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) {
        possibilities[r][c] = new Set(getPossibleValues(grid, r, c));
        if (possibilities[r][c].size === 0) {
          return returnDifficulty ? -0.2 : puzzle;
        }
        emptyCellsCount++;
      }
    }
  }

  let progress = true;
  let steps = 0;

  while (emptyCellsCount > 0 && progress) {
    progress = false;

    // Find and apply naked singles
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] === 0 && possibilities[r][c].size === 1) {
          const val = [...possibilities[r][c]][0];
          grid[r][c] = val;
          emptyCellsCount--;
          steps++;
          progress = true;

          // Update possibilities
          for (let i = 0; i < 9; i++) {
            possibilities[r][i].delete(val);
            possibilities[i][c].delete(val);
          }
          const startRow = Math.floor(r / 3) * 3;
          const startCol = Math.floor(c / 3) * 3;
          for (let row = startRow; row < startRow + 3; row++) {
            for (let col = startCol; col < startCol + 3; col++) {
              possibilities[row][col].delete(val);
            }
          }
          possibilities[r][c] = new Set();
        }
      }
    }

    // Find and apply hidden singles
    for (let unit = 0; unit < 9; unit++) {
      // Rows
      for (let num = 1; num <= 9; num++) {
        const locations = [];
        for (let c = 0; c < 9; c++) {
          if (grid[unit][c] === 0 && possibilities[unit][c].has(num)) {
            locations.push(c);
          }
        }
        if (locations.length === 1) {
          const c = locations[0];
          grid[unit][c] = num;
          emptyCellsCount--;
          steps++;
          progress = true;

          // Update possibilities
          for (let i = 0; i < 9; i++) {
            possibilities[unit][i].delete(num);
            possibilities[i][c].delete(num);
          }
          const startRow = Math.floor(unit / 3) * 3;
          const startCol = Math.floor(c / 3) * 3;
          for (let row = startRow; row < startRow + 3; row++) {
            for (let col = startCol; col < startCol + 3; col++) {
              possibilities[row][col].delete(num);
            }
          }
          possibilities[unit][c] = new Set();
        }
      }

      // Columns
      for (let num = 1; num <= 9; num++) {
        const locations = [];
        for (let r = 0; r < 9; r++) {
          if (grid[r][unit] === 0 && possibilities[r][unit].has(num)) {
            locations.push(r);
          }
        }
        if (locations.length === 1) {
          const r = locations[0];
          grid[r][unit] = num;
          emptyCellsCount--;
          steps++;
          progress = true;

          // Update possibilities
          for (let i = 0; i < 9; i++) {
            possibilities[r][i].delete(num);
            possibilities[i][unit].delete(num);
          }
          const startRow = Math.floor(r / 3) * 3;
          const startCol = Math.floor(unit / 3) * 3;
          for (let row = startRow; row < startRow + 3; row++) {
            for (let col = startCol; col < startCol + 3; col++) {
              possibilities[row][col].delete(num);
            }
          }
          possibilities[r][unit] = new Set();
        }
      }

      // Boxes
      const boxRow = Math.floor(unit / 3) * 3;
      const boxCol = (unit % 3) * 3;
      for (let num = 1; num <= 9; num++) {
        const locations = [];
        for (let r = boxRow; r < boxRow + 3; r++) {
          for (let c = boxCol; c < boxCol + 3; c++) {
            if (grid[r][c] === 0 && possibilities[r][c].has(num)) {
              locations.push({ r, c });
            }
          }
        }
        if (locations.length === 1) {
          const { r, c } = locations[0];
          grid[r][c] = num;
          emptyCellsCount--;
          steps++;
          progress = true;

          // Update possibilities
          for (let i = 0; i < 9; i++) {
            possibilities[r][i].delete(num);
            possibilities[i][c].delete(num);
          }
          for (let row = boxRow; row < boxRow + 3; row++) {
            for (let col = boxCol; col < boxCol + 3; col++) {
              possibilities[row][col].delete(num);
            }
          }
          possibilities[r][c] = new Set();
        }
      }
    }
  }

  if (emptyCellsCount === 0) {
    const difficulty = initialEmptyCells > 0 ? steps / initialEmptyCells : 0.0;
    return returnDifficulty ? difficulty : grid;
  }

  // Stuck - requires guessing
  return returnDifficulty ? -0.1 : puzzle;
}

// ============================================================================
// PUZZLE GENERATION
// ============================================================================

/**
 * Generates a playable Sudoku puzzle with specified difficulty.
 * @param {number} minDifficulty - Minimum difficulty (0-1)
 * @param {number} maxDifficulty - Maximum difficulty (0-1)
 * @param {number} targetClues - Target number of clues
 * @param {number} maxAttempts - Maximum generation attempts
 * @returns {number[][]} Generated puzzle grid
 */
export function generatePuzzle(
  minDifficulty = 0.3,
  maxDifficulty = 0.7,
  targetClues = 25,
  maxAttempts = 50,
) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const solution = generateSolution();
    const puzzle = deepCopyGrid(solution);

    // Create list of all cell positions and shuffle
    const positions = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        positions.push([r, c]);
      }
    }
    shuffle(positions);

    let cluesRemaining = 81;

    for (const [r, c] of positions) {
      if (cluesRemaining <= targetClues) break;

      const originalValue = puzzle[r][c];
      puzzle[r][c] = 0;

      const difficulty = solveWithSingles(puzzle, true);

      if (difficulty < 0) {
        // Not solvable with singles, restore
        puzzle[r][c] = originalValue;
      } else {
        cluesRemaining--;

        if (
          cluesRemaining <= targetClues &&
          difficulty >= minDifficulty &&
          difficulty <= maxDifficulty
        ) {
          return puzzle;
        }
      }
    }

    // Check final difficulty
    const finalDifficulty = solveWithSingles(puzzle, true);
    if (
      finalDifficulty >= minDifficulty &&
      finalDifficulty <= maxDifficulty &&
      cluesRemaining <= targetClues + 5
    ) {
      return puzzle;
    }
  }

  // Fallback: return any solvable puzzle
  const solution = generateSolution();
  const puzzle = deepCopyGrid(solution);
  const positions = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      positions.push([r, c]);
    }
  }
  shuffle(positions);

  let cluesRemaining = 81;
  for (const [r, c] of positions) {
    if (cluesRemaining <= targetClues) break;

    const originalValue = puzzle[r][c];
    puzzle[r][c] = 0;

    const difficulty = solveWithSingles(puzzle, true);
    if (difficulty < 0) {
      puzzle[r][c] = originalValue;
    } else {
      cluesRemaining--;
    }
  }

  return puzzle;
}

/**
 * Generates a simple puzzle by removing random cells from a solution.
 * @param {number} cluesToRemove - Number of cells to empty
 * @returns {number[][]} Generated puzzle grid
 */
export function generateSimplePuzzle(cluesToRemove = 40) {
  const solution = generateSolution();
  const puzzle = deepCopyGrid(solution);

  const positions = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      positions.push([r, c]);
    }
  }
  shuffle(positions);

  for (let i = 0; i < cluesToRemove && i < positions.length; i++) {
    const [r, c] = positions[i];
    puzzle[r][c] = 0;
  }

  return puzzle;
}

// ============================================================================
// SOLUTION VERIFICATION
// ============================================================================

/**
 * Solves a puzzle completely using backtracking.
 * Used for solution verification.
 * @param {number[][]} puzzle - Puzzle to solve
 * @returns {number[][]|null} Solved grid or null if unsolvable
 */
export function solvePuzzle(puzzle) {
  const grid = deepCopyGrid(puzzle);

  function solve() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] === 0) {
          for (let num = 1; num <= 9; num++) {
            // Check validity
            let valid = true;

            // Row
            if (grid[r].includes(num)) valid = false;

            // Column
            if (valid) {
              for (let i = 0; i < 9; i++) {
                if (grid[i][c] === num) {
                  valid = false;
                  break;
                }
              }
            }

            // Box
            if (valid) {
              const startRow = Math.floor(r / 3) * 3;
              const startCol = Math.floor(c / 3) * 3;
              outer: for (let row = startRow; row < startRow + 3; row++) {
                for (let col = startCol; col < startCol + 3; col++) {
                  if (grid[row][col] === num) {
                    valid = false;
                    break outer;
                  }
                }
              }
            }

            if (valid) {
              grid[r][c] = num;
              if (solve()) return true;
              grid[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  return solve() ? grid : null;
}

/**
 * Checks if a value matches the correct solution for a cell.
 * @param {number[][]} originalPuzzle - Original puzzle with clues
 * @param {number} row - Row index
 * @param {number} col - Column index
 * @param {number} value - Value to check
 * @returns {boolean} True if value matches solution
 */
export function isCorrectValue(originalPuzzle, row, col, value) {
  const solution = solvePuzzle(originalPuzzle);
  if (!solution) return false;
  return solution[row][col] === value;
}

// ============================================================================
// EXPORTS SUMMARY
// ============================================================================

export default {
  // Conversion
  stringToGrid,
  safeStringToGrid,
  gridToString,
  deepCopyGrid,
  getBoxIndex,

  // Creation helpers
  createEmptyGrid,
  createEmptyNotes,
  createLockedCellsMask,

  // Validation
  validateSudokuString,
  getPossibleValues,
  findConflicts,
  hasConflicts,
  isValidSolution,
  isGridComplete,

  // Solving
  solveWithSingles,
  solvePuzzle,
  generateSolution,

  // Generation
  generatePuzzle,
  generateSimplePuzzle,

  // Verification
  isCorrectValue,
};
