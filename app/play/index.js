/**
 * Play/Scan Screen
 *
 * NFC scanning screen to read Sudoku puzzles from tags.
 */

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../../components/Button";
import NfcStatusIndicator from "../../components/NfcStatusIndicator";
import SettingsModal from "../../components/SettingsModal";
import {
  BorderRadius,
  Colors,
  Spacing,
  Typography,
} from "../../constants/app-theme";
import { useGame } from "../../context/game-context";
import {
  cancelNfcScan,
  isNfcEnabled,
  isNfcSupported,
  openNfcSettings,
  readPuzzlesFromTag,
} from "../../modules/nfc-handler";

export default function PlayScanScreen() {
  const router = useRouter();
  const { setScannedPuzzles, clearScannedPuzzles, scannedPuzzles, debugMode } =
    useGame();
  const [isScanning, setIsScanning] = useState(false);
  const [nfcStatus, setNfcStatus] = useState("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Hardcoded debug puzzles (only used when debugMode is enabled)
  const DEBUG_PUZZLES = [
    "009000000000005620145000000200970001070401060400063008000000514032500000000000700",
  ];

  // Handle back navigation - clear puzzles when going back to main
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        clearScannedPuzzles();
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace("/");
        }
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );
      return () => subscription.remove();
    }, [clearScannedPuzzles, router]),
  );

  // If we already have scanned puzzles, go to puzzle list
  useEffect(() => {
    if (scannedPuzzles.length > 0) {
      router.replace("/play/puzzle-list");
    }
  }, [scannedPuzzles]);

  const startScanning = async () => {
    // Debug mode: skip NFC checks and use hardcoded puzzles
    if (debugMode) {
      setScannedPuzzles(DEBUG_PUZZLES);
      return;
    }

    try {
      // Check NFC support
      const supported = await isNfcSupported();
      if (!supported) {
        Alert.alert("NFC Not Supported", "Your device does not support NFC.", [
          { text: "OK", onPress: handleBack },
        ]);
        return;
      }

      // Check NFC enabled
      const enabled = await isNfcEnabled();
      if (!enabled) {
        Alert.alert("NFC Disabled", "Please enable NFC to scan tags.", [
          { text: "Cancel", onPress: handleBack },
          { text: "Open Settings", onPress: openNfcSettings },
        ]);
        return;
      }

      setIsScanning(true);
      setNfcStatus("scanning");
      setStatusMessage("Waiting for NFC tag...");

      const result = await readPuzzlesFromTag(() => {
        setStatusMessage("Tag detected, reading...");
      });

      if (result.success && result.puzzles.length > 0) {
        setNfcStatus("success");
        setStatusMessage(`Found ${result.puzzles.length} puzzle(s)!`);

        // Store puzzles - useEffect will handle navigation when state updates
        setScannedPuzzles(result.puzzles);
        // Note: Navigation is handled by useEffect watching scannedPuzzles
      } else {
        setNfcStatus("error");
        setStatusMessage(result.message || "No valid puzzles found");

        if (result.errors.length > 0) {
          console.log("Read errors:", result.errors);
        }
      }
    } catch (error) {
      setNfcStatus("error");
      setStatusMessage(error.message || "Failed to read NFC tag");
    } finally {
      setIsScanning(false);
    }
  };

  const handleCancelScan = async () => {
    await cancelNfcScan();
    setIsScanning(false);
    setNfcStatus("idle");
    setStatusMessage("");
  };

  const handleBack = () => {
    if (isScanning) {
      cancelNfcScan();
    }
    clearScannedPuzzles();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  const handleRetry = () => {
    setNfcStatus("idle");
    setStatusMessage("");
    startScanning();
  };

  // Auto-start scanning when screen loads
  useEffect(() => {
    startScanning();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Scan NFC Tag</Text>
        <Pressable
          style={styles.settingsButton}
          onPress={() => setSettingsVisible(true)}
        >
          <Ionicons
            name="settings-outline"
            size={24}
            color={Colors.textPrimary}
          />
        </Pressable>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <NfcStatusIndicator status={nfcStatus} message={statusMessage} />

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {isScanning && (
            <Button
              title="Cancel"
              variant="outline"
              onPress={handleCancelScan}
            />
          )}

          {!isScanning && nfcStatus === "error" && (
            <Button title="Try Again" onPress={handleRetry} />
          )}

          {!isScanning && nfcStatus === "idle" && (
            <Button title="Start Scanning" onPress={startScanning} />
          )}
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>How to scan:</Text>
          <Text style={styles.instructionText}>
            1. Hold your device near an NFC tag{"\n"}
            2. Keep it steady until scanning completes{"\n"}
            3. The tag should contain Sudoku puzzle data
          </Text>
        </View>
      </View>

      {/* Settings Modal */}
      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
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
  title: {
    flex: 1,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  settingsButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.screenHorizontal,
  },
  actionsContainer: {
    marginTop: Spacing.xxl,
  },
  instructions: {
    marginTop: Spacing.xxxl,
    padding: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    width: "100%",
  },
  instructionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  instructionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});
