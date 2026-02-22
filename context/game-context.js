/**
 * Game State Context
 *
 * Manages global application state including:
 * - Scanned puzzles list
 * - Current game state
 * - Settings (error checking mode)
 * - Session management
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";
import { AppState } from "react-native";
import {
  createEmptyGrid,
  createEmptyNotes,
  createLockedCellsMask,
  deepCopyGrid,
  safeStringToGrid,
} from "../modules/sudoku-engine";

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Error checking modes
 * 0: None - No validation
 * 1: Conflicts - Highlight all conflicting cells
 * 2: Verified - Only highlight incorrect value (against solution)
 */
export const ERROR_MODES = {
  NONE: 0,
  CONFLICTS: 1,
  VERIFIED: 2,
};

export const ERROR_MODE_LABELS = {
  [ERROR_MODES.NONE]: "None",
  [ERROR_MODES.CONFLICTS]: "Conflicts",
  [ERROR_MODES.VERIFIED]: "Verified Solution",
};

// Storage keys
const STORAGE_KEYS = {
  ERROR_MODE: "@sudoku_error_mode",
  BACKGROUND_STATE: "@sudoku_background_state",
};

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState = {
  // Scanned puzzles from NFC tag
  scannedPuzzles: [],

  // Currently selected puzzle index
  currentPuzzleIndex: -1,

  // Current game state
  currentGame: null,
  // {
  //   originalGrid: number[][],
  //   currentGrid: number[][],
  //   notes: Set[][][],  // 9x9 array of Sets
  //   lockedCells: boolean[][],
  //   selectedCell: { row: number, col: number } | null,
  //   isComplete: boolean,
  //   startTime: number,
  //   elapsedTime: number,
  // }

  // Saved game states per puzzle index (preserves progress when switching)
  gameStates: {},

  // Settings
  errorMode: ERROR_MODES.NONE,

  // UI state
  isPencilMode: false,
  isLoading: false,

  // Session flag to track if we have an active puzzle session
  hasActiveSession: false,
};

// ============================================================================
// ACTION TYPES
// ============================================================================

const ActionTypes = {
  SET_SCANNED_PUZZLES: "SET_SCANNED_PUZZLES",
  CLEAR_SCANNED_PUZZLES: "CLEAR_SCANNED_PUZZLES",
  SELECT_PUZZLE: "SELECT_PUZZLE",
  START_GAME: "START_GAME",
  UPDATE_CELL: "UPDATE_CELL",
  TOGGLE_NOTE: "TOGGLE_NOTE",
  CLEAR_CELL: "CLEAR_CELL",
  SELECT_CELL: "SELECT_CELL",
  RESET_PUZZLE: "RESET_PUZZLE",
  SET_PENCIL_MODE: "SET_PENCIL_MODE",
  SET_ERROR_MODE: "SET_ERROR_MODE",
  SET_LOADING: "SET_LOADING",
  UPDATE_ELAPSED_TIME: "UPDATE_ELAPSED_TIME",
  RESTORE_STATE: "RESTORE_STATE",
  MARK_COMPLETE: "MARK_COMPLETE",
};

// ============================================================================
// REDUCER
// ============================================================================

function gameReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_SCANNED_PUZZLES:
      return {
        ...state,
        scannedPuzzles: action.payload,
        hasActiveSession: action.payload.length > 0,
      };

    case ActionTypes.CLEAR_SCANNED_PUZZLES:
      return {
        ...state,
        scannedPuzzles: [],
        currentPuzzleIndex: -1,
        currentGame: null,
        gameStates: {},
        hasActiveSession: false,
      };

    case ActionTypes.SELECT_PUZZLE:
      return {
        ...state,
        currentPuzzleIndex: action.payload,
      };

    case ActionTypes.START_GAME: {
      const { puzzleString, puzzleIndex } = action.payload;

      // Save current game state if switching puzzles
      let newGameStates = { ...state.gameStates };
      if (
        state.currentGame &&
        state.currentPuzzleIndex >= 0 &&
        state.currentPuzzleIndex !== puzzleIndex
      ) {
        newGameStates[state.currentPuzzleIndex] = state.currentGame;
      }

      // Check if we have existing state for this puzzle
      if (newGameStates[puzzleIndex]) {
        const savedGame = newGameStates[puzzleIndex];
        return {
          ...state,
          gameStates: newGameStates,
          currentPuzzleIndex: puzzleIndex,
          currentGame: {
            ...savedGame,
            // Reset start time to continue timer from elapsed
            startTime: Date.now() - savedGame.elapsedTime,
            selectedCell: null,
          },
        };
      }

      // Use safe parsing to handle potential errors
      let grid = safeStringToGrid(puzzleString);

      // Fallback to empty grid if parsing fails
      if (!grid) {
        console.warn(
          "START_GAME: Failed to parse puzzle string, using empty grid",
        );
        grid = createEmptyGrid();
      }

      // Create defensive copies and structures
      const lockedCells = createLockedCellsMask(grid);
      const notes = createEmptyNotes();

      return {
        ...state,
        gameStates: newGameStates,
        currentPuzzleIndex: puzzleIndex,
        currentGame: {
          originalGrid: deepCopyGrid(grid),
          currentGrid: deepCopyGrid(grid),
          notes,
          lockedCells,
          selectedCell: null,
          isComplete: false,
          startTime: Date.now(),
          elapsedTime: 0,
        },
      };
    }

    case ActionTypes.UPDATE_CELL: {
      if (!state.currentGame) return state;

      const { row, col, value } = action.payload;

      // Boundary checks
      if (row < 0 || row >= 9 || col < 0 || col >= 9) {
        console.warn("UPDATE_CELL: Invalid cell coordinates", { row, col });
        return state;
      }

      // Check if cell is locked
      if (state.currentGame.lockedCells?.[row]?.[col]) return state;

      const newGrid = deepCopyGrid(state.currentGame.currentGrid);
      // Ensure valid value (0-9)
      const safeValue =
        typeof value === "number" && !isNaN(value)
          ? Math.max(0, Math.min(9, Math.floor(value)))
          : 0;
      newGrid[row][col] = safeValue;

      // Clear notes for this cell when placing a number
      const newNotes = state.currentGame.notes.map((r, ri) =>
        r.map((c, ci) => {
          if (ri === row && ci === col) {
            return new Set();
          }
          return new Set(c);
        }),
      );

      return {
        ...state,
        currentGame: {
          ...state.currentGame,
          currentGrid: newGrid,
          notes: newNotes,
        },
      };
    }

    case ActionTypes.TOGGLE_NOTE: {
      if (!state.currentGame) return state;

      const { row, col, value } = action.payload;

      // Boundary checks
      if (row < 0 || row >= 9 || col < 0 || col >= 9) {
        console.warn("TOGGLE_NOTE: Invalid cell coordinates", { row, col });
        return state;
      }

      if (state.currentGame.lockedCells?.[row]?.[col]) return state;
      if (state.currentGame.currentGrid?.[row]?.[col] !== 0) return state;

      // Ensure value is valid (1-9)
      const safeValue =
        typeof value === "number" && value >= 1 && value <= 9 ? value : null;
      if (safeValue === null) return state;

      const newNotes = state.currentGame.notes.map((r, ri) =>
        r.map((c, ci) => {
          if (ri === row && ci === col) {
            const newSet = new Set(c);
            if (newSet.has(value)) {
              newSet.delete(value);
            } else {
              newSet.add(value);
            }
            return newSet;
          }
          return new Set(c);
        }),
      );

      return {
        ...state,
        currentGame: {
          ...state.currentGame,
          notes: newNotes,
        },
      };
    }

    case ActionTypes.CLEAR_CELL: {
      if (!state.currentGame) return state;

      const { row, col } = action.payload;

      // Boundary checks
      if (row < 0 || row >= 9 || col < 0 || col >= 9) {
        console.warn("CLEAR_CELL: Invalid cell coordinates", { row, col });
        return state;
      }

      if (state.currentGame.lockedCells?.[row]?.[col]) return state;

      const newGrid = deepCopyGrid(state.currentGame.currentGrid);
      newGrid[row][col] = 0;

      const newNotes = state.currentGame.notes.map((r, ri) =>
        r.map((c, ci) => {
          if (ri === row && ci === col) {
            return new Set();
          }
          return new Set(c);
        }),
      );

      return {
        ...state,
        currentGame: {
          ...state.currentGame,
          currentGrid: newGrid,
          notes: newNotes,
        },
      };
    }

    case ActionTypes.SELECT_CELL:
      if (!state.currentGame) return state;

      // Validate cell coordinates if provided
      const cell = action.payload;
      if (cell !== null) {
        if (typeof cell !== "object" || cell.row == null || cell.col == null) {
          console.warn("SELECT_CELL: Invalid cell object", cell);
          return state;
        }
        if (cell.row < 0 || cell.row >= 9 || cell.col < 0 || cell.col >= 9) {
          console.warn("SELECT_CELL: Invalid cell coordinates", cell);
          return state;
        }
      }

      return {
        ...state,
        currentGame: {
          ...state.currentGame,
          selectedCell: cell,
        },
      };

    case ActionTypes.RESET_PUZZLE: {
      if (!state.currentGame) return state;

      // Create fresh notes array
      const notes = createEmptyNotes();

      return {
        ...state,
        currentGame: {
          ...state.currentGame,
          currentGrid: deepCopyGrid(state.currentGame.originalGrid),
          notes,
          selectedCell: null,
          isComplete: false,
          startTime: Date.now(),
          elapsedTime: 0,
        },
      };
    }

    case ActionTypes.SET_PENCIL_MODE:
      return {
        ...state,
        isPencilMode: action.payload,
      };

    case ActionTypes.SET_ERROR_MODE:
      return {
        ...state,
        errorMode: action.payload,
      };

    case ActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case ActionTypes.UPDATE_ELAPSED_TIME:
      if (!state.currentGame) return state;
      return {
        ...state,
        currentGame: {
          ...state.currentGame,
          elapsedTime: action.payload,
        },
      };

    case ActionTypes.MARK_COMPLETE: {
      if (!state.currentGame) return state;

      const completedGame = {
        ...state.currentGame,
        isComplete: true,
      };

      // Save to gameStates as well
      const newGameStates = { ...state.gameStates };
      if (state.currentPuzzleIndex >= 0) {
        newGameStates[state.currentPuzzleIndex] = completedGame;
      }

      return {
        ...state,
        gameStates: newGameStates,
        currentGame: completedGame,
      };
    }

    case ActionTypes.RESTORE_STATE:
      return {
        ...state,
        ...action.payload,
      };

    default:
      return state;
  }
}

// ============================================================================
// CONTEXT
// ============================================================================

const GameContext = createContext(null);

// ============================================================================
// PROVIDER
// ============================================================================

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const appStateRef = useRef(AppState.currentState);
  const timerRef = useRef(null);

  // Load error mode from storage on mount
  useEffect(() => {
    loadErrorMode();
  }, []);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );
    return () => {
      subscription?.remove();
    };
  }, [state]);

  // Timer for elapsed time
  useEffect(() => {
    if (state.currentGame && !state.currentGame.isComplete) {
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - state.currentGame.startTime;
        dispatch({ type: ActionTypes.UPDATE_ELAPSED_TIME, payload: elapsed });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [state.currentGame?.startTime, state.currentGame?.isComplete]);

  const handleAppStateChange = useCallback(
    async (nextAppState) => {
      if (
        appStateRef.current === "active" &&
        nextAppState.match(/inactive|background/)
      ) {
        // App going to background - save state for restoration
        await saveBackgroundState();
      } else if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // App coming to foreground - state is already in memory
        // No action needed as we're using in-memory state
      }
      appStateRef.current = nextAppState;
    },
    [state],
  );

  const loadErrorMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(STORAGE_KEYS.ERROR_MODE);
      if (savedMode !== null) {
        dispatch({
          type: ActionTypes.SET_ERROR_MODE,
          payload: parseInt(savedMode, 10),
        });
      }
    } catch (error) {
      console.error("Error loading error mode:", error);
    }
  };

  const saveBackgroundState = async () => {
    try {
      // Only save minimal state for background restoration
      const stateToSave = {
        hasActiveSession: state.hasActiveSession,
        currentPuzzleIndex: state.currentPuzzleIndex,
        scannedPuzzles: state.scannedPuzzles,
        errorMode: state.errorMode,
      };
      await AsyncStorage.setItem(
        STORAGE_KEYS.BACKGROUND_STATE,
        JSON.stringify(stateToSave),
      );
    } catch (error) {
      console.error("Error saving background state:", error);
    }
  };

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const setScannedPuzzles = useCallback((puzzles) => {
    dispatch({ type: ActionTypes.SET_SCANNED_PUZZLES, payload: puzzles });
  }, []);

  const clearScannedPuzzles = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_SCANNED_PUZZLES });
  }, []);

  const selectPuzzle = useCallback((index) => {
    dispatch({ type: ActionTypes.SELECT_PUZZLE, payload: index });
  }, []);

  const startGame = useCallback((puzzleString, puzzleIndex) => {
    dispatch({
      type: ActionTypes.START_GAME,
      payload: { puzzleString, puzzleIndex },
    });
  }, []);

  const updateCell = useCallback((row, col, value) => {
    dispatch({ type: ActionTypes.UPDATE_CELL, payload: { row, col, value } });
  }, []);

  const toggleNote = useCallback((row, col, value) => {
    dispatch({ type: ActionTypes.TOGGLE_NOTE, payload: { row, col, value } });
  }, []);

  const clearCell = useCallback((row, col) => {
    dispatch({ type: ActionTypes.CLEAR_CELL, payload: { row, col } });
  }, []);

  const selectCell = useCallback((cell) => {
    dispatch({ type: ActionTypes.SELECT_CELL, payload: cell });
  }, []);

  const resetPuzzle = useCallback(() => {
    dispatch({ type: ActionTypes.RESET_PUZZLE });
  }, []);

  const setPencilMode = useCallback((enabled) => {
    dispatch({ type: ActionTypes.SET_PENCIL_MODE, payload: enabled });
  }, []);

  const togglePencilMode = useCallback(() => {
    dispatch({
      type: ActionTypes.SET_PENCIL_MODE,
      payload: !state.isPencilMode,
    });
  }, [state.isPencilMode]);

  const setErrorMode = useCallback(async (mode) => {
    dispatch({ type: ActionTypes.SET_ERROR_MODE, payload: mode });
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ERROR_MODE, mode.toString());
    } catch (error) {
      console.error("Error saving error mode:", error);
    }
  }, []);

  const setLoading = useCallback((loading) => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: loading });
  }, []);

  const markComplete = useCallback(() => {
    dispatch({ type: ActionTypes.MARK_COMPLETE });
  }, []);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value = {
    // State
    ...state,

    // Actions
    setScannedPuzzles,
    clearScannedPuzzles,
    selectPuzzle,
    startGame,
    updateCell,
    toggleNote,
    clearCell,
    selectCell,
    resetPuzzle,
    setPencilMode,
    togglePencilMode,
    setErrorMode,
    setLoading,
    markComplete,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}

export default {
  GameProvider,
  useGame,
  ERROR_MODES,
  ERROR_MODE_LABELS,
};
