/**
 * NfcStatusIndicator Component
 *
 * Shows NFC scanning status with animation.
 */

import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { Colors, Spacing, Typography } from "../constants/app-theme";

/**
 * @param {Object} props
 * @param {'scanning' | 'success' | 'error' | 'idle'} props.status - Current NFC status
 * @param {string} props.message - Status message to display
 */
function NfcStatusIndicator({ status = "idle", message }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status === "scanning") {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [status]);

  const getStatusIcon = () => {
    switch (status) {
      case "scanning":
        return "scan-outline";
      case "success":
        return "checkmark-circle";
      case "error":
        return "alert-circle";
      default:
        return "wifi-outline";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "scanning":
        return Colors.primary;
      case "success":
        return Colors.success;
      case "error":
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  if (status === "idle" && !message) return null;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [{ scale: pulseAnim }],
            backgroundColor: `${getStatusColor()}20`,
          },
        ]}
      >
        <Ionicons name={getStatusIcon()} size={48} color={getStatusColor()} />
      </Animated.View>
      {message && (
        <Text style={[styles.message, { color: getStatusColor() }]}>
          {message}
        </Text>
      )}
      {status === "scanning" && (
        <Text style={styles.subMessage}>Hold your device near the NFC tag</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xxl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  message: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.medium,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subMessage: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});

export default NfcStatusIndicator;
