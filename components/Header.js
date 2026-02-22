/**
 * Header Component
 *
 * App header with title and settings gear icon.
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Colors, Spacing, Typography } from "../constants/app-theme";

/**
 * @param {Object} props
 * @param {string} props.title - Header title
 * @param {string} props.subtitle - Optional subtitle
 * @param {boolean} props.showSettings - Whether to show settings icon
 * @param {function} props.onSettingsPress - Settings press handler
 * @param {boolean} props.showBack - Whether to show back button
 * @param {function} props.onBackPress - Back press handler
 * @param {React.ReactNode} props.rightContent - Custom right content
 */
function Header({
  title,
  subtitle,
  showSettings = false,
  onSettingsPress,
  showBack = false,
  onBackPress,
  rightContent,
}) {
  return (
    <View style={styles.container}>
      {/* Left section */}
      <View style={styles.leftSection}>
        {showBack && (
          <Pressable style={styles.backButton} onPress={onBackPress}>
            <Ionicons
              name="chevron-back"
              size={24}
              color={Colors.textPrimary}
            />
          </Pressable>
        )}
        <View style={styles.titleContainer}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>

      {/* Right section */}
      <View style={styles.rightSection}>
        {rightContent}
        {showSettings && (
          <Pressable style={styles.settingsButton} onPress={onSettingsPress}>
            <Ionicons
              name="settings-outline"
              size={24}
              color={Colors.textPrimary}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.screenHorizontal,
    paddingVertical: Spacing.md,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    marginRight: Spacing.sm,
    padding: Spacing.xs,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSize.title,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  settingsButton: {
    padding: Spacing.sm,
  },
});

export default Header;
