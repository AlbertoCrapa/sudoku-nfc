/**
 * Write Buffer Context
 *
 * Manages the pending list of Sudoku puzzles to be written to NFC.
 * Supports adding puzzles from different sources (manual, fill, generate),
 * removing items, preventing duplicates, and tracking write status.
 */

import { createContext, useCallback, useContext, useReducer } from "react";
import { validateSudokuString } from "../modules/sudoku-engine";

// ============================================================================
// CONSTANTS
// ============================================================================

// Each puzzle is 81 characters + commas between them
const BYTES_PER_PUZZLE = 81;
const BYTES_PER_DELIMITER = 1;

// Default setting for duplicate prevention
const DEFAULT_ALLOW_DUPLICATES = false;

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState = {
  // Array of pending puzzle strings (each 81 characters)
  pendingPuzzles: [],

  // Settings
  allowDuplicates: DEFAULT_ALLOW_DUPLICATES,

  // Write operation status
  writeStatus: {
    isWriting: false,
    nfcStatus: "idle", // idle, scanning, success, error
    message: "",
    lastWriteResult: null,
  },
};

// ============================================================================
// ACTION TYPES
// ============================================================================

const ActionTypes = {
  ADD_PUZZLE: "ADD_PUZZLE",
  REMOVE_PUZZLE: "REMOVE_PUZZLE",
  CLEAR_ALL_PUZZLES: "CLEAR_ALL_PUZZLES",
  SET_ALLOW_DUPLICATES: "SET_ALLOW_DUPLICATES",
  SET_WRITE_STATUS: "SET_WRITE_STATUS",
  RESET_WRITE_STATUS: "RESET_WRITE_STATUS",
  SET_LAST_WRITE_RESULT: "SET_LAST_WRITE_RESULT",
};

// ============================================================================
// REDUCER
// ============================================================================

function writeBufferReducer(state, action) {
  switch (action.type) {
    case ActionTypes.ADD_PUZZLE: {
      const { puzzle, allowDuplicate } = action.payload;

      // Check for duplicate if not allowed
      if (!allowDuplicate && !state.allowDuplicates) {
        if (state.pendingPuzzles.includes(puzzle)) {
          return state; // Don't add duplicate
        }
      }

      return {
        ...state,
        pendingPuzzles: [...state.pendingPuzzles, puzzle],
      };
    }

    case ActionTypes.REMOVE_PUZZLE: {
      const { index } = action.payload;
      return {
        ...state,
        pendingPuzzles: state.pendingPuzzles.filter((_, i) => i !== index),
      };
    }

    case ActionTypes.CLEAR_ALL_PUZZLES:
      return {
        ...state,
        pendingPuzzles: [],
      };

    case ActionTypes.SET_ALLOW_DUPLICATES:
      return {
        ...state,
        allowDuplicates: action.payload,
      };

    case ActionTypes.SET_WRITE_STATUS:
      return {
        ...state,
        writeStatus: {
          ...state.writeStatus,
          ...action.payload,
        },
      };

    case ActionTypes.RESET_WRITE_STATUS:
      return {
        ...state,
        writeStatus: {
          isWriting: false,
          nfcStatus: "idle",
          message: "",
          lastWriteResult: state.writeStatus.lastWriteResult,
        },
      };

    case ActionTypes.SET_LAST_WRITE_RESULT:
      return {
        ...state,
        writeStatus: {
          ...state.writeStatus,
          lastWriteResult: action.payload,
        },
      };

    default:
      return state;
  }
}

// ============================================================================
// CONTEXT
// ============================================================================

const WriteBufferContext = createContext(null);

// ============================================================================
// PROVIDER
// ============================================================================

export function WriteBufferProvider({ children }) {
  const [state, dispatch] = useReducer(writeBufferReducer, initialState);

  // ============================================================================
  // VALIDATION HELPERS
  // ============================================================================

  /**
   * Validates a puzzle string before adding to buffer.
   * @param {string} puzzle - 81-character puzzle string
   * @returns {{ valid: boolean, error?: string, normalized?: string }}
   */
  const validatePuzzle = useCallback((puzzle) => {
    if (!puzzle || typeof puzzle !== "string") {
      return { valid: false, error: "Invalid puzzle input." };
    }

    // Normalize: replace . with 0
    const normalized = puzzle.replace(/\./g, "0");

    // Use existing validation
    const validation = validateSudokuString(normalized);
    if (!validation.valid) {
      return { valid: false, error: validation.error };
    }

    return { valid: true, normalized };
  }, []);

  /**
   * Checks if a puzzle is already in the pending list.
   * @param {string} puzzle - 81-character puzzle string (normalized)
   * @returns {boolean}
   */
  const isDuplicate = useCallback(
    (puzzle) => {
      const normalized = puzzle.replace(/\./g, "0");
      return state.pendingPuzzles.includes(normalized);
    },
    [state.pendingPuzzles],
  );

  // ============================================================================
  // ACTIONS
  // ============================================================================

  /**
   * Adds a puzzle to the pending list.
   * @param {string} puzzle - 81-character puzzle string
   * @param {boolean} forceDuplicate - Allow duplicate even if setting is off
   * @returns {{ success: boolean, error?: string }}
   */
  const addPuzzle = useCallback(
    (puzzle, forceDuplicate = false) => {
      const validation = validatePuzzle(puzzle);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Check for duplicate
      if (!forceDuplicate && !state.allowDuplicates) {
        if (isDuplicate(validation.normalized)) {
          return {
            success: false,
            error: "This puzzle is already in the pending list.",
          };
        }
      }

      dispatch({
        type: ActionTypes.ADD_PUZZLE,
        payload: {
          puzzle: validation.normalized,
          allowDuplicate: forceDuplicate,
        },
      });

      return { success: true };
    },
    [validatePuzzle, isDuplicate, state.allowDuplicates],
  );

  /**
   * Removes a puzzle from the pending list by index.
   * @param {number} index - Index of puzzle to remove
   */
  const removePuzzle = useCallback(
    (index) => {
      if (index >= 0 && index < state.pendingPuzzles.length) {
        dispatch({ type: ActionTypes.REMOVE_PUZZLE, payload: { index } });
      }
    },
    [state.pendingPuzzles.length],
  );

  /**
   * Clears all puzzles from the pending list.
   */
  const clearAllPuzzles = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_ALL_PUZZLES });
  }, []);

  /**
   * Sets whether to allow duplicate puzzles.
   * @param {boolean} allow
   */
  const setAllowDuplicates = useCallback((allow) => {
    dispatch({ type: ActionTypes.SET_ALLOW_DUPLICATES, payload: allow });
  }, []);

  /**
   * Updates write status.
   * @param {object} status - Partial status update
   */
  const setWriteStatus = useCallback((status) => {
    dispatch({ type: ActionTypes.SET_WRITE_STATUS, payload: status });
  }, []);

  /**
   * Resets write status to idle.
   */
  const resetWriteStatus = useCallback(() => {
    dispatch({ type: ActionTypes.RESET_WRITE_STATUS });
  }, []);

  /**
   * Sets the last write result.
   * @param {object} result - Write result object
   */
  const setLastWriteResult = useCallback((result) => {
    dispatch({ type: ActionTypes.SET_LAST_WRITE_RESULT, payload: result });
  }, []);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  /**
   * Calculates the total byte size of all pending puzzles.
   * @returns {number}
   */
  const getTotalBytes = useCallback(() => {
    const count = state.pendingPuzzles.length;
    if (count === 0) return 0;
    return count * BYTES_PER_PUZZLE + (count - 1) * BYTES_PER_DELIMITER;
  }, [state.pendingPuzzles.length]);

  /**
   * Gets the count of pending puzzles.
   * @returns {number}
   */
  const getPendingCount = useCallback(() => {
    return state.pendingPuzzles.length;
  }, [state.pendingPuzzles.length]);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value = {
    // State
    pendingPuzzles: state.pendingPuzzles,
    allowDuplicates: state.allowDuplicates,
    writeStatus: state.writeStatus,

    // Validation
    validatePuzzle,
    isDuplicate,

    // Actions
    addPuzzle,
    removePuzzle,
    clearAllPuzzles,
    setAllowDuplicates,
    setWriteStatus,
    resetWriteStatus,
    setLastWriteResult,

    // Computed
    getTotalBytes,
    getPendingCount,
  };

  return (
    <WriteBufferContext.Provider value={value}>
      {children}
    </WriteBufferContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useWriteBuffer() {
  const context = useContext(WriteBufferContext);
  if (!context) {
    throw new Error("useWriteBuffer must be used within a WriteBufferProvider");
  }
  return context;
}

export default {
  WriteBufferProvider,
  useWriteBuffer,
};
