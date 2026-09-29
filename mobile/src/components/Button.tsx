import React from "react";
import {
  TouchableOpacity,
  Text,
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
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
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
        <ActivityIndicator color={Colors.white} size="small" />
      ) : (
        <Text style={[styles.baseText, textStyleFinal, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    width: "100%",
  },
  baseText: {
    fontSize: 15,
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
});
