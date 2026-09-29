import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme";
import { BrandHeader } from "../components/BrandHeader";
import { Button } from "../components/Button";
import { apiClient } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface OtpVerificationScreenProps {
  navigation: any;
  route: any;
}

export const OtpVerificationScreen: React.FC<OtpVerificationScreenProps> = ({
  navigation,
  route,
}) => {
  const { email, devOtp } = route.params || {};
  const { loginWithToken } = useAuth();

  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef<TextInput>(null);

  // Auto focus input when screen loads
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // 30-second cooldown timer
  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerify = async () => {
    setError(null);
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    try {
      setLoading(true);
      Keyboard.dismiss();
      const res = await apiClient.post("/auth/verify-otp", {
        email,
        code: otpCode.trim(),
      });

      if (res.data?.success) {
        const { token, user } = res.data.data;
        await loginWithToken(token, user);

        if (!user.hasCompletedProfile) {
          navigation.reset({
            index: 0,
            routes: [{ name: "ProfileSetup" }],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: "Home" }],
          });
        }
      }
    } catch (err: any) {
      setError(err.message || "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    try {
      setError(null);
      await apiClient.post("/auth/resend-otp", { email });
      setCountdown(30);
      setCanResend(false);
    } catch (err: any) {
      setError(err.message || "Failed to resend code.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
        >
          {/* Top Navigation */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color={Colors.primaryGreen} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <BrandHeader showSubtitle={false} />

          <Text style={styles.title}>Enter OTP</Text>
          <Text style={styles.subtitle}>
            We've sent a code to <Text style={styles.highlightText}>{email}</Text>. It expires in 10 minutes.
          </Text>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={Colors.errorText} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Quick Reviewer / Tester Code Assistant */}
          <TouchableOpacity
            style={styles.hintBox}
            activeOpacity={0.7}
            onPress={() => setOtpCode(devOtp || "123456")}
          >
            <Ionicons name="key-outline" size={16} color={Colors.primaryGreen} />
            <Text style={styles.hintText}>
              Reviewer / Demo code: <Text style={{ fontWeight: "700" }}>{devOtp || "123456"}</Text> (Tap to auto-fill)
            </Text>
          </TouchableOpacity>

          <Text style={styles.fieldLabel}>6-digit code</Text>

          {/* Guaranteed Focus Tap Area */}
          <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
            <View style={[styles.otpContainer, isFocused ? styles.otpContainerFocused : null]}>
              <TextInput
                ref={inputRef}
                value={otpCode}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9]/g, "").slice(0, 6);
                  setOtpCode(cleaned);
                  if (error) setError(null);
                  if (cleaned.length === 6) {
                    Keyboard.dismiss();
                  }
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="- - - - - -"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                maxLength={6}
                style={styles.otpInput}
                autoFocus={true}
                cursorColor={Colors.amberAccent}
                selectionColor={Colors.amberAccent}
              />
            </View>
          </TouchableWithoutFeedback>

          <TouchableOpacity
            onPress={handleResend}
            disabled={!canResend}
            style={styles.resendWrapper}
          >
            <Text
              style={[
                styles.resendText,
                !canResend && { color: Colors.textMuted },
              ]}
            >
              {canResend ? "Resend code" : `Resend code in ${countdown}s`}
            </Text>
          </TouchableOpacity>

          <View style={styles.buttonWrapper}>
            <Button
              title={loading ? "Verifying..." : "Verify"}
              onPress={handleVerify}
              loading={loading}
              disabled={otpCode.length < 6}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.screenBg,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 20,
    gap: 4,
  },
  backText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.primaryGreen,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 28,
  },
  highlightText: {
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.errorBg,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: Colors.errorText,
    fontSize: 13,
    flex: 1,
  },
  hintBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  hintText: {
    color: Colors.primaryGreen,
    fontSize: 13,
    flex: 1,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  otpContainer: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 52,
    justifyContent: "center",
  },
  otpContainerFocused: {
    borderColor: Colors.amberAccent,
  },
  otpInput: {
    fontSize: 24,
    letterSpacing: 10,
    textAlign: "left",
    fontWeight: "700",
    color: Colors.textPrimary,
    height: "100%",
  },
  resendWrapper: {
    alignSelf: "flex-start",
    marginTop: 12,
    marginBottom: 24,
  },
  resendText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primaryGreen,
  },
  buttonWrapper: {
    marginTop: 10,
  },
});
