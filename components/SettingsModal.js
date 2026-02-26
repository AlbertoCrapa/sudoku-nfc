/**
 * SettingsModal Component
 *
 * Modal for app settings including error checking mode and gameplay preferences.
 */

import { Ionicons } from "@expo/vector-icons";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  BorderRadius,
  Colors,
  Spacing,
  Typography,
} from "../constants/app-theme";
import {
  ERROR_MODES,
  ERROR_MODE_LABELS,
  useGame,
} from "../context/game-context";

/**
 * Toggle setting row component
 */
function SettingToggle({ label, description, value, onValueChange }) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleTextContainer}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.borderMedium, true: Colors.primaryLight }}
        thumbColor={value ? Colors.primary : Colors.surface}
        ios_backgroundColor={Colors.borderMedium}
      />
    </View>
  );
}

/**
 * @param {Object} props
 * @param {boolean} props.visible - Whether modal is visible
 * @param {function} props.onClose - Close handler
 */
function SettingsModal({ visible, onClose }) {
  const {
    errorMode,
    setErrorMode,
    showTimer,
    setShowTimer,
    autoCandidateRemoval,
    setAutoCandidateRemoval,
    highlightSameDigits,
    setHighlightSameDigits,
    highlightRegions,
    setHighlightRegions,
  } = useGame();

  const errorModeOptions = [
    {
      mode: ERROR_MODES.NONE,
      label: ERROR_MODE_LABELS[ERROR_MODES.NONE],
      description: "No error validation or visual feedback",
    },
    {
      mode: ERROR_MODES.CONFLICTS,
      label: ERROR_MODE_LABELS[ERROR_MODES.CONFLICTS],
      description: "Highlight all conflicting cells in row, column, and box",
    },
    {
      mode: ERROR_MODES.VERIFIED,
      label: ERROR_MODE_LABELS[ERROR_MODES.VERIFIED],
      description: "Only highlight cells with incorrect values",
    },
  ];

  const handleModeSelect = (mode) => {
    setErrorMode(mode);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </Pressable>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Display Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Display</Text>

            <SettingToggle
              label="Show Timer"
              description="Display elapsed time while playing"
              value={showTimer}
              onValueChange={setShowTimer}
            />

            <SettingToggle
              label="Highlight Same Digits"
              description="Highlight all cells with the same number when selecting a filled cell"
              value={highlightSameDigits}
              onValueChange={setHighlightSameDigits}
            />

            <SettingToggle
              label="Highlight Regions"
              description="Highlight the row, column, and box of the selected cell"
              value={highlightRegions}
              onValueChange={setHighlightRegions}
            />
          </View>

          {/* Gameplay Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gameplay</Text>

            <SettingToggle
              label="Auto Candidate Removal"
              description="Automatically remove pencil marks when a number is placed in the same row, column, or box"
              value={autoCandidateRemoval}
              onValueChange={setAutoCandidateRemoval}
            />
          </View>

          {/* Error Checking Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Error Checking Mode</Text>
            <Text style={styles.sectionDescription}>
              Choose how errors are displayed while playing
            </Text>

            <View style={styles.optionsContainer}>
              {errorModeOptions.map((option) => (
                <Pressable
                  key={option.mode}
                  style={[
                    styles.optionButton,
                    errorMode === option.mode && styles.optionButtonSelected,
                  ]}
                  onPress={() => handleModeSelect(option.mode)}
                >
                  <View style={styles.optionHeader}>
                    <View
                      style={[
                        styles.radioOuter,
                        errorMode === option.mode && styles.radioOuterSelected,
                      ]}
                    >
                      {errorMode === option.mode && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.optionLabel,
                        errorMode === option.mode && styles.optionLabelSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </View>
                  <Text style={styles.optionDescription}>
                    {option.description}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Bottom padding for scroll */}
          <View style={{ height: Spacing.xxxl }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.screenHorizontal,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xxxl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  sectionDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  // Toggle styles
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  toggleTextContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  toggleLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  toggleDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  // Radio button styles
  optionsContainer: {
    gap: Spacing.md,
  },
  optionButton: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  optionButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.highlightedCell,
  },
  optionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.borderMedium,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  radioOuterSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  optionLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  optionLabelSelected: {
    color: Colors.primaryLight,
  },
  optionDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginLeft: 32, // Align with label
    lineHeight: 18,
  },
});

export default SettingsModal;
