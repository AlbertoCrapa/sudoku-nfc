/**
 * Pending List Screen
 *
 * Shows the list of pending Sudoku puzzles to be written to NFC.
 * Allows removing items, clearing all, and writing to NFC.
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../../components/Button";
import NfcStatusIndicator from "../../components/NfcStatusIndicator";
import {
  BorderRadius,
  Colors,
  Spacing,
  Typography,
} from "../../constants/app-theme";
import { useWriteBuffer } from "../../context/write-buffer-context";
import {
  analyzePuzzleDifficulty,
  getDifficultyInfoFromScore,
  stringToGrid,
} from "../../modules/sudoku-engine";
import {
  isNfcEnabled,
  isNfcSupported,
  openNfcSettings,
  writePuzzlesToTag,
} from "../../modules/nfc-handler";

const DIFFICULTY_COLORS = {
  easy: Colors.success,
  medium: "#eab308",
  hard: "#f97316",
  expert: Colors.error,
  invalid: Colors.textMuted,
};

export default function PendingListScreen() {
  const router = useRouter();
  const {
    pendingPuzzles,
    allowDuplicates,
    writeStatus,
    removePuzzle,
    clearAllPuzzles,
    setAllowDuplicates,
    setWriteStatus,
    resetWriteStatus,
    setLastWriteResult,
    getTotalBytes,
  } = useWriteBuffer();

  const [isWriting, setIsWriting] = useState(false);

  const handleRemovePuzzle = useCallback(
    (index) => {
      Alert.alert(
        "Remove Puzzle",
        `Remove Puzzle ${index + 1} from the pending list?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: () => removePuzzle(index),
          },
        ],
      );
    },
    [removePuzzle],
  );

  const handleClearAll = useCallback(() => {
    Alert.alert("Clear All", "Remove all puzzles from the pending list?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear All",
        style: "destructive",
        onPress: clearAllPuzzles,
      },
    ]);
  }, [clearAllPuzzles]);

  const handleWriteToNfc = async () => {
    if (pendingPuzzles.length === 0) return;

    try {
      // Check NFC support
      const supported = await isNfcSupported();
      if (!supported) {
        Alert.alert("NFC Not Supported", "Your device does not support NFC.");
        return;
      }

      // Check NFC enabled
      const enabled = await isNfcEnabled();
      if (!enabled) {
        Alert.alert("NFC Disabled", "Please enable NFC to write to tags.", [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: openNfcSettings },
        ]);
        return;
      }

      setIsWriting(true);
      setWriteStatus({
        isWriting: true,
        nfcStatus: "scanning",
        message: "Ready to write...",
      });

      const result = await writePuzzlesToTag(pendingPuzzles, false, () => {
        setWriteStatus({ message: "Tag detected, writing..." });
      });

      setLastWriteResult(result);

      if (result.overflow) {
        // Too many puzzles for tag capacity
        setWriteStatus({ nfcStatus: "idle", message: "" });
        Alert.alert(
          "Too Many Sudokus!",
          `Loaded: ${result.attempted} - Max: ${result.maxPuzzles}\n\nWhat do you want to do?`,
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => {
                clearAllPuzzles();
                router.replace("/write");
              },
            },
            {
              text: "Remove Sudokus",
              onPress: () => {
                // Stay on current screen to let user remove puzzles
              },
            },
          ],
        );
      } else if (result.success) {
        setWriteStatus({ nfcStatus: "success", message: result.message });
        // Don't auto-navigate - let user retry or finish
      } else {
        setWriteStatus({ nfcStatus: "error", message: result.message });
      }
    } catch (error) {
      setWriteStatus({
        nfcStatus: "error",
        message: error.message || "Failed to write to NFC tag",
      });
    } finally {
      setIsWriting(false);
      setWriteStatus({ isWriting: false });
    }
  };

  const handleCancelWrite = () => {
    setIsWriting(false);
    resetWriteStatus();
  };

  const handleRetryWrite = () => {
    resetWriteStatus();
    // Small delay to reset UI before starting again
    setTimeout(() => handleWriteToNfc(), 100);
  };

  const handleFinishWrite = () => {
    clearAllPuzzles();
    resetWriteStatus();
    router.back();
  };

  const getClueCount = (puzzleString) => {
    try {
      const grid = stringToGrid(puzzleString);
      return grid.flat().filter((cell) => cell !== 0).length;
    } catch {
      return 0;
    }
  };

  const getDifficulty = (puzzleString) => {
    try {
      const grid = stringToGrid(puzzleString);
      const info = analyzePuzzleDifficulty(grid);
      return {
        ...info,
        color: DIFFICULTY_COLORS[info.key] || Colors.textMuted,
      };
    } catch {
      const info = getDifficultyInfoFromScore(-0.2);
      return {
        ...info,
        color: DIFFICULTY_COLORS[info.key] || Colors.textMuted,
      };
    }
  };

  const formatPercentage = (percentage) => {
    return `${percentage.toFixed(1)}%`;
  };

  const renderPuzzleItem = ({ item, index }) => {
    const clueCount = getClueCount(item);
    const difficulty = getDifficulty(item);

    return (
      <View style={styles.puzzleCard}>
        <View style={styles.puzzleInfo}>
          <View style={styles.puzzleHeader}>
            <Text style={styles.puzzleTitle}>Puzzle {index + 1}</Text>
            <View
              style={[
                styles.difficultyBadge,
                { backgroundColor: `${difficulty.color}20` },
              ]}
            >
              <Text
                style={[styles.difficultyText, { color: difficulty.color }]}
              >
                {difficulty.label} {formatPercentage(difficulty.percentage)}
              </Text>
            </View>
          </View>
          <Text style={styles.puzzleStats}>{clueCount} clues • 81 bytes</Text>
        </View>
        <Pressable
          style={styles.removeButton}
          onPress={() => handleRemovePuzzle(index)}
          hitSlop={8}
        >
          <Ionicons name="close-circle" size={24} color={Colors.error} />
        </Pressable>
      </View>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="documents-outline" size={64} color={Colors.textMuted} />
      <Text style={styles.emptyTitle}>No Puzzles Added</Text>
      <Text style={styles.emptyText}>
        Go back and add puzzles using Manual String, Fill Sudoku, or Generate
        Sudoku
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Pending Puzzles</Text>
          <Text style={styles.subtitle}>
            {pendingPuzzles.length} puzzle
            {pendingPuzzles.length !== 1 ? "s" : ""} • {getTotalBytes()} bytes
          </Text>
        </View>
        {pendingPuzzles.length > 0 && (
          <Pressable style={styles.clearButton} onPress={handleClearAll}>
            <Ionicons name="trash-outline" size={22} color={Colors.error} />
          </Pressable>
        )}
      </View>

      {/* Settings */}
      <View style={styles.settingsRow}>
        <Text style={styles.settingLabel}>Allow Duplicates</Text>
        <Switch
          value={allowDuplicates}
          onValueChange={setAllowDuplicates}
          trackColor={{ false: Colors.borderLight, true: Colors.primary }}
          thumbColor={Colors.surface}
        />
      </View>

      {/* NFC Status */}
      {(isWriting || writeStatus.nfcStatus !== "idle") && (
        <View style={styles.nfcStatusContainer}>
          <NfcStatusIndicator
            status={writeStatus.nfcStatus}
            message={writeStatus.message}
          />
          {isWriting && (
            <Button
              title="Cancel"
              variant="outline"
              onPress={handleCancelWrite}
              style={styles.cancelButton}
            />
          )}
          {!isWriting &&
            (writeStatus.nfcStatus === "success" ||
              writeStatus.nfcStatus === "error") && (
              <View style={styles.nfcActionButtons}>
                <Button
                  title="Write Another"
                  variant="secondary"
                  onPress={handleRetryWrite}
                  style={styles.retryButton}
                />
                {writeStatus.nfcStatus === "success" && (
                  <Button
                    title="Done"
                    onPress={handleFinishWrite}
                    style={styles.doneButton}
                  />
                )}
                {writeStatus.nfcStatus === "error" && (
                  <Button
                    title="Cancel"
                    variant="outline"
                    onPress={resetWriteStatus}
                    style={styles.doneButton}
                  />
                )}
              </View>
            )}
        </View>
      )}

      {/* Puzzle List */}
      <FlatList
        data={pendingPuzzles}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderPuzzleItem}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={[
          styles.listContent,
          pendingPuzzles.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom Buttons */}
      {!isWriting &&
        writeStatus.nfcStatus === "idle" &&
        pendingPuzzles.length > 0 && (
          <View style={styles.bottomButtons}>
            <Button
              title="Add More"
              variant="secondary"
              onPress={() => router.back()}
              style={styles.addButton}
            />
            <Button
              title="Write to NFC"
              onPress={handleWriteToNfc}
              style={styles.writeButton}
            />
          </View>
        )}
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
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  clearButton: {
    padding: Spacing.sm,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.screenHorizontal,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.screenHorizontal,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  settingLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
  },
  nfcStatusContainer: {
    alignItems: "center",
    marginVertical: Spacing.lg,
    paddingHorizontal: Spacing.screenHorizontal,
  },
  cancelButton: {
    marginTop: Spacing.lg,
  },
  nfcActionButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
    width: "100%",
  },
  retryButton: {
    flex: 1,
  },
  doneButton: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: Spacing.xxl,
  },
  listContentEmpty: {
    flex: 1,
    justifyContent: "center",
  },
  puzzleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  puzzleInfo: {
    flex: 1,
  },
  puzzleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  puzzleTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  difficultyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  difficultyText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  puzzleStats: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  removeButton: {
    padding: Spacing.xs,
  },
  emptyContainer: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  bottomButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    paddingHorizontal: Spacing.screenHorizontal,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  addButton: {
    flex: 1,
  },
  writeButton: {
    flex: 2,
  },
});
