/**
 * GameTimer Component
 *
 * Displays elapsed game time.
 */

import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  BorderRadius,
  Colors,
  Spacing,
  Typography,
} from "../constants/app-theme";

/**
 * @param {Object} props
 * @param {number} props.elapsedMs - Elapsed time in milliseconds
 */
function GameTimer({ elapsedMs = 0 }) {
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    const paddedMinutes = String(minutes).padStart(2, "0");
    const paddedSeconds = String(seconds).padStart(2, "0");

    return `${paddedMinutes}:${paddedSeconds}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.time}>{formatTime(elapsedMs)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.timerBackground,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  time: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.timerText,
    fontVariant: ["tabular-nums"],
  },
});

export default memo(GameTimer);
