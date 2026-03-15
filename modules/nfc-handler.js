/**
 * NFC Module
 *
 * Handles NFC reading and writing operations for Sudoku puzzles.
 * Uses raw comma-separated 81-character strings for minimal byte usage.
 * Format: "81chars,81chars,81chars" (no prefixes, no metadata)
 */

import NfcManager, { Ndef, NfcTech } from "react-native-nfc-manager";
import { validateSudokuString } from "./sudoku-engine";

// ============================================================================
// CONSTANTS
// ============================================================================

// Delimiter for separating puzzles in the NFC tag (comma for minimal bytes)
const PUZZLE_DELIMITER = ",";

// Each puzzle is 81 chars, plus 1 comma delimiter between puzzles
const BYTES_PER_PUZZLE = 81;
const BYTES_PER_DELIMITER = 1;

// ============================================================================
// NFC AVAILABILITY
// ============================================================================

/**
 * Checks if NFC is supported on the device.
 * @returns {Promise<boolean>}
 */
export async function isNfcSupported() {
  try {
    // Check if NfcManager is available and has the required method
    if (
      NfcManager == null ||
      NfcManager.isSupported == null ||
      typeof NfcManager.isSupported !== "function"
    ) {
      return false;
    }
    const supported = await NfcManager.isSupported();
    if (supported) {
      await NfcManager.start();
    }
    return supported;
  } catch (error) {
    console.error("Error checking NFC support:", error);
    return false;
  }
}

/**
 * Checks if NFC is currently enabled.
 * @returns {Promise<boolean>}
 */
export async function isNfcEnabled() {
  try {
    if (NfcManager == null || NfcManager.isEnabled == null) {
      return false;
    }
    return await NfcManager.isEnabled();
  } catch (error) {
    console.error("Error checking NFC enabled state:", error);
    return false;
  }
}

/**
 * Initializes the NFC manager.
 * @returns {Promise<boolean>} True if initialization successful
 */
export async function initNfc() {
  try {
    await NfcManager.start();
    return true;
  } catch (error) {
    console.error("Error initializing NFC:", error);
    return false;
  }
}

/**
 * Opens device NFC settings (Android only).
 */
export async function openNfcSettings() {
  try {
    await NfcManager.goToNfcSetting();
  } catch (error) {
    console.error("Error opening NFC settings:", error);
  }
}

// ============================================================================
// DATA ENCODING/DECODING
// ============================================================================

/**
 * Encodes puzzle data for NFC storage.
 * Format: Raw comma-separated 81-character strings (e.g., "81chars,81chars,81chars")
 * @param {string[]} puzzles - Array of 81-character puzzle strings
 * @returns {string} Encoded string for NFC
 */
export function encodePuzzleData(puzzles) {
  if (!Array.isArray(puzzles) || puzzles.length === 0) {
    throw new Error("At least one puzzle is required.");
  }

  // Validate all puzzles
  for (const puzzle of puzzles) {
    const validation = validateSudokuString(puzzle);
    if (!validation.valid) {
      throw new Error(`Invalid puzzle: ${validation.error}`);
    }
  }

  // Normalize all puzzles (convert . to 0 for consistency)
  const normalized = puzzles.map((p) => p.replace(/\./g, "0"));

  return normalized.join(PUZZLE_DELIMITER);
}

/**
 * Calculates the byte size of encoded puzzle data.
 * @param {number} puzzleCount - Number of puzzles
 * @returns {number} Total bytes required
 */
export function calculatePuzzleBytes(puzzleCount) {
  if (puzzleCount <= 0) return 0;
  // 81 bytes per puzzle + (puzzleCount - 1) commas between them
  return (
    puzzleCount * BYTES_PER_PUZZLE + (puzzleCount - 1) * BYTES_PER_DELIMITER
  );
}

/**
 * Calculates how many complete puzzles can fit in available bytes.
 * @param {number} availableBytes - Available tag capacity in bytes
 * @returns {number} Maximum number of puzzles that fit
 */
export function maxPuzzlesForCapacity(availableBytes) {
  if (availableBytes < BYTES_PER_PUZZLE) return 0;
  // First puzzle: 81 bytes, each additional: 82 bytes (81 + comma)
  // Total = 81 + (n-1) * 82 = 81 + 82n - 82 = 82n - 1
  // n = (availableBytes + 1) / 82
  return Math.floor(
    (availableBytes + 1) / (BYTES_PER_PUZZLE + BYTES_PER_DELIMITER),
  );
}

/**
 * Decodes puzzle data from NFC storage.
 * Expects raw comma-separated 81-character strings.
 * @param {string} data - Raw data from NFC tag
 * @returns {{ puzzles: string[], errors: string[] }}
 */
export function decodePuzzleData(data) {
  const result = {
    puzzles: [],
    errors: [],
  };

  if (!data || typeof data !== "string") {
    result.errors.push("No data provided.");
    return result;
  }

  // Trim whitespace
  const trimmed = data.trim();
  if (!trimmed) {
    result.errors.push("Empty data.");
    return result;
  }

  // Split by comma
  const rawPuzzles = trimmed.split(PUZZLE_DELIMITER);

  for (let i = 0; i < rawPuzzles.length; i++) {
    const puzzle = rawPuzzles[i].trim();
    if (!puzzle) continue;

    // Validate length first (must be exactly 81 characters)
    if (puzzle.length !== 81) {
      result.errors.push(
        `Entry ${i + 1}: Invalid length ${puzzle.length}, expected 81 characters.`,
      );
      continue;
    }

    const validation = validateSudokuString(puzzle);
    if (validation.valid) {
      // Normalize (convert . to 0)
      result.puzzles.push(puzzle.replace(/\./g, "0"));
    } else {
      result.errors.push(`Entry ${i + 1}: ${validation.error}`);
    }
  }

  return result;
}

// ============================================================================
// NFC READING
// ============================================================================

/**
 * Reads Sudoku puzzles from an NFC tag.
 * @param {function} onTagDetected - Callback when tag is detected
 * @returns {Promise<{ success: boolean, puzzles: string[], errors: string[], message?: string }>}
 */
export async function readPuzzlesFromTag(onTagDetected = null) {
  try {
    // Check NFC availability
    const supported = await isNfcSupported();
    if (!supported) {
      return {
        success: false,
        puzzles: [],
        errors: [],
        message: "NFC is not supported on this device.",
      };
    }

    const enabled = await isNfcEnabled();
    if (!enabled) {
      return {
        success: false,
        puzzles: [],
        errors: [],
        message: "NFC is disabled. Please enable NFC in settings.",
      };
    }

    // Request NFC technology
    await NfcManager.requestTechnology(NfcTech.Ndef);

    // Get tag
    const tag = await NfcManager.getTag();

    if (onTagDetected) {
      onTagDetected(tag);
    }

    if (!tag) {
      return {
        success: false,
        puzzles: [],
        errors: [],
        message: "No tag detected.",
      };
    }

    // Check for NDEF messages
    if (!tag.ndefMessage || tag.ndefMessage.length === 0) {
      return {
        success: false,
        puzzles: [],
        errors: [],
        message: "Tag is empty or does not contain NDEF data.",
      };
    }

    // Read the first NDEF record (text)
    const record = tag.ndefMessage[0];
    let payload = "";

    if (record.tnf === Ndef.TNF_WELL_KNOWN && record.type) {
      // Handle text record
      const textData = Ndef.text.decodePayload(record.payload);
      payload = textData;
    } else {
      // Try to decode as raw bytes
      payload = String.fromCharCode(...record.payload);
    }

    // Decode puzzle data
    const decoded = decodePuzzleData(payload);

    if (decoded.puzzles.length === 0) {
      return {
        success: false,
        puzzles: [],
        errors: decoded.errors,
        message: "No valid puzzles found on tag.",
      };
    }

    return {
      success: true,
      puzzles: decoded.puzzles,
      errors: decoded.errors,
      message: `Found ${decoded.puzzles.length} puzzle(s).`,
    };
  } catch (error) {
    console.error("Error reading NFC tag:", error);
    return {
      success: false,
      puzzles: [],
      errors: [error.message || "Unknown error"],
      message: "Failed to read NFC tag.",
    };
  } finally {
    // Always clean up
    try {
      await NfcManager.cancelTechnologyRequest();
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

// ============================================================================
// NFC WRITING
// ============================================================================

/**
 * Gets the writable capacity of an NFC tag in bytes.
 * @param {object} tag - NFC tag object
 * @returns {number} Writable capacity in bytes, or 0 if unknown
 */
function getTagCapacity(tag) {
  if (!tag) return 0;

  // Try to get max size from tag info
  // Different NFC tag types have different capacities
  // NTAG213: ~144 bytes, NTAG215: ~504 bytes, NTAG216: ~888 bytes
  // The tag object should have maxSize property
  if (tag.maxSize) {
    return tag.maxSize;
  }

  // Fallback to a conservative estimate for NTAG213 (most common)
  // Account for NDEF overhead (typically ~10-20 bytes for text record)
  return 120;
}

/**
 * Writes Sudoku puzzles to an NFC tag with capacity awareness.
 * Returns overflow info if puzzles exceed capacity, without writing.
 *
 * @param {string[]} puzzles - Array of 81-character puzzle strings
 * @param {boolean} append - If true, append to existing puzzles
 * @param {function} onTagDetected - Callback when tag is detected
 * @returns {Promise<{
 *   success: boolean,
 *   message: string,
 *   written: number,
 *   attempted: number,
 *   discarded: number,
 *   capacity?: number,
 *   maxPuzzles?: number,
 *   overflow?: boolean
 * }>}
 */
export async function writePuzzlesToTag(
  puzzles,
  append = false,
  onTagDetected = null,
) {
  const result = {
    success: false,
    message: "",
    written: 0,
    attempted: puzzles.length,
    discarded: 0,
    overflow: false,
  };

  try {
    // Check NFC availability
    const supported = await isNfcSupported();
    if (!supported) {
      result.message = "NFC is not supported on this device.";
      return result;
    }

    const enabled = await isNfcEnabled();
    if (!enabled) {
      result.message = "NFC is disabled. Please enable NFC in settings.";
      return result;
    }

    // Request NFC technology
    await NfcManager.requestTechnology(NfcTech.Ndef);

    // Get tag
    const tag = await NfcManager.getTag();

    if (onTagDetected) {
      onTagDetected(tag);
    }

    if (!tag) {
      result.message = "No tag detected.";
      return result;
    }

    let allPuzzles = [...puzzles];

    // If appending, read existing puzzles first
    if (append && tag.ndefMessage && tag.ndefMessage.length > 0) {
      const record = tag.ndefMessage[0];
      let payload = "";

      if (record.tnf === Ndef.TNF_WELL_KNOWN && record.type) {
        payload = Ndef.text.decodePayload(record.payload);
      } else {
        payload = String.fromCharCode(...record.payload);
      }

      const decoded = decodePuzzleData(payload);
      allPuzzles = [...decoded.puzzles, ...puzzles];
      result.attempted = allPuzzles.length;
    }

    // Get tag capacity
    const capacity = getTagCapacity(tag);
    result.capacity = capacity;

    // Account for NDEF overhead (text record header ~7-15 bytes depending on encoding)
    const ndefOverhead = 15;
    const availableBytes = Math.max(0, capacity - ndefOverhead);

    // Calculate how many complete puzzles can fit
    const maxPuzzles = maxPuzzlesForCapacity(availableBytes);

    // Check if puzzles exceed capacity
    result.maxPuzzles = maxPuzzles;
    result.discarded = Math.max(0, allPuzzles.length - maxPuzzles);

    if (maxPuzzles === 0) {
      result.message = "Tag capacity too small for even one puzzle.";
      return result;
    }

    // If there are too many puzzles, return overflow info without writing
    if (allPuzzles.length > maxPuzzles) {
      result.overflow = true;
      result.attempted = allPuzzles.length;
      result.message = `Too many puzzles. Loaded: ${allPuzzles.length} - Max: ${maxPuzzles}`;
      return result;
    }

    // All puzzles fit, proceed with writing
    const puzzlesToWrite = allPuzzles;
    result.written = puzzlesToWrite.length;

    // Encode data
    const encodedData = encodePuzzleData(puzzlesToWrite);

    // Create NDEF message
    const bytes = Ndef.encodeMessage([Ndef.textRecord(encodedData)]);

    if (!bytes) {
      result.message = "Failed to encode data.";
      return result;
    }

    // Write to tag
    await NfcManager.ndefHandler.writeNdefMessage(bytes);

    result.success = true;
    result.message = `Successfully wrote ${result.written} puzzle(s) to tag.`;
    return result;
  } catch (error) {
    console.error("Error writing NFC tag:", error);
    result.message = error.message || "Failed to write to NFC tag.";
    return result;
  } finally {
    // Always clean up
    try {
      await NfcManager.cancelTechnologyRequest();
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

// ============================================================================
// SCAN SESSION MANAGEMENT
// ============================================================================

/**
 * Cancels any active NFC scan session.
 */
export async function cancelNfcScan() {
  try {
    await NfcManager.cancelTechnologyRequest();
  } catch (error) {
    // Ignore errors during cancel
  }
}

/**
 * Registers a listener for NFC state changes (Android).
 * @param {function} callback - Callback function
 */
export function registerNfcStateListener(callback) {
  // Note: This is a placeholder. react-native-nfc-manager handles this internally.
  // For production, you might want to use AppState to detect when app comes to foreground
  // and re-check NFC status.
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Availability
  isNfcSupported,
  isNfcEnabled,
  initNfc,
  openNfcSettings,

  // Encoding/Decoding
  encodePuzzleData,
  decodePuzzleData,
  calculatePuzzleBytes,
  maxPuzzlesForCapacity,

  // Read/Write
  readPuzzlesFromTag,
  writePuzzlesToTag,
  cancelNfcScan,

  // Constants
  BYTES_PER_PUZZLE,
};
