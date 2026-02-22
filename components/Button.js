/**
 * Button Component
 *
 * Reusable button with multiple variants.
 */

import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import {
  BorderRadius,
  Colors,
  Spacing,
  Typography,
} from "../constants/app-theme";

/**
 * @param {Object} props
 * @param {string} props.title - Button text
 * @param {function} props.onPress - Press handler
 * @param {'primary' | 'secondary' | 'outline'} props.variant - Button style variant
 * @param {'small' | 'medium' | 'large'} props.size - Button size
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {boolean} props.loading - Whether to show loading indicator
 * @param {boolean} props.fullWidth - Whether button should take full width
 * @param {Object} props.style - Additional styles
 */
function Button({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
}) {
  const getButtonStyle = () => {
    const styles = [baseStyles.button];

    // Variant styles
    switch (variant) {
      case "primary":
        styles.push(baseStyles.primaryButton);
        break;
      case "secondary":
        styles.push(baseStyles.secondaryButton);
        break;
      case "outline":
        styles.push(baseStyles.outlineButton);
        break;
    }

    // Size styles
    switch (size) {
      case "small":
        styles.push(baseStyles.smallButton);
        break;
      case "medium":
        styles.push(baseStyles.mediumButton);
        break;
      case "large":
        styles.push(baseStyles.largeButton);
        break;
    }

    // State styles
    if (disabled || loading) {
      styles.push(baseStyles.disabledButton);
    }

    if (fullWidth) {
      styles.push(baseStyles.fullWidth);
    }

    return styles;
  };

  const getTextStyle = () => {
    const styles = [baseStyles.text];

    // Variant text styles
    switch (variant) {
      case "primary":
        styles.push(baseStyles.primaryText);
        break;
      case "secondary":
        styles.push(baseStyles.secondaryText);
        break;
      case "outline":
        styles.push(baseStyles.outlineText);
        break;
    }

    // Size text styles
    switch (size) {
      case "small":
        styles.push(baseStyles.smallText);
        break;
      case "medium":
        styles.push(baseStyles.mediumText);
        break;
      case "large":
        styles.push(baseStyles.largeText);
        break;
    }

    if (disabled) {
      styles.push(baseStyles.disabledText);
    }

    return styles;
  };

  return (
    <Pressable
      style={({ pressed }) => [
        ...getButtonStyle(),
        pressed && !disabled && baseStyles.pressed,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "outline" ? Colors.primary : Colors.textOnPrimary}
          size="small"
        />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </Pressable>
  );
}

const baseStyles = StyleSheet.create({
  button: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: BorderRadius.xl,
  },
  primaryButton: {
    backgroundColor: Colors.buttonPrimary,
  },
  secondaryButton: {
    backgroundColor: Colors.buttonSecondary,
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  smallButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  mediumButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  largeButton: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
  },
  disabledButton: {
    opacity: 0.5,
  },
  fullWidth: {
    width: "100%",
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  text: {
    fontWeight: Typography.fontWeight.semibold,
    textAlign: "center",
  },
  primaryText: {
    color: Colors.textOnPrimary,
  },
  secondaryText: {
    color: Colors.textSecondary,
  },
  outlineText: {
    color: Colors.primary,
  },
  smallText: {
    fontSize: Typography.fontSize.sm,
  },
  mediumText: {
    fontSize: Typography.fontSize.md,
  },
  largeText: {
    fontSize: Typography.fontSize.lg,
  },
  disabledText: {
    color: Colors.textMuted,
  },
});

export default Button;
