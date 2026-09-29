import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from "react-native";
import { Colors } from "../theme";

interface InputFieldProps extends TextInputProps {
  label?: string;
  leftIcon?: React.ReactNode;
  prefix?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  leftIcon,
  prefix,
  error,
  containerStyle,
  onFocus,
  onBlur,
  style,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          error ? styles.inputError : null,
        ]}
      >
        {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
        {prefix && <Text style={styles.prefixText}>{prefix}</Text>}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.textMuted}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus && onFocus(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur && onBlur(e);
          }}
          {...rest}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: "100%",
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 46,
  },
  inputFocused: {
    borderColor: Colors.amberAccent,
    shadowColor: Colors.amberAccent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  inputError: {
    borderColor: Colors.errorText,
  },
  iconContainer: {
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  prefixText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    paddingVertical: 10,
  },
  errorText: {
    fontSize: 12,
    color: Colors.errorText,
    marginTop: 4,
  },
});
