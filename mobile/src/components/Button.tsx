import React from "react";
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import { Colors } from "../theme";

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "dangerOutline";
  leftIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  leftIcon,
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;

  let buttonStyle: ViewStyle = styles.primary;
  let textStyleFinal: TextStyle = styles.primaryText;

  if (variant === "secondary") {
    buttonStyle = styles.secondary;
    textStyleFinal = styles.secondaryText;
  } else if (variant === "dangerOutline") {
    buttonStyle = styles.dangerOutline;
    textStyleFinal = styles.dangerOutlineText;
  }

  if (isDisabled && variant === "primary") {
    buttonStyle = { ...buttonStyle, backgroundColor: Colors.buttonDisabled };
  }

  return (
    <TouchableOpacity
      style={[styles.base, buttonStyle, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "dangerOutline" ? Colors.dangerRed : Colors.white}
          size="small"
        />
      ) : (
        <View style={styles.contentRow}>
          {leftIcon}
          <Text style={[styles.baseText, textStyleFinal, textStyle]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    width: "100%",
  },
  baseText: {
    fontSize: 16,
    fontWeight: "600",
  },
  primary: {
    backgroundColor: Colors.primaryGreen,
  },
  primaryText: {
    color: Colors.white,
  },
  secondary: {
    backgroundColor: Colors.chipBg,
    borderWidth: 1,
    borderColor: Colors.chipBorder,
  },
  secondaryText: {
    color: Colors.textPrimary,
  },
  dangerOutline: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
  },
  dangerOutlineText: {
    color: Colors.dangerRed,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
});
