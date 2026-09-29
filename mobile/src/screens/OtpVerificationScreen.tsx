import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme";
import { BrandHeader } from "../components/BrandHeader";
import { InputField } from "../components/InputField";
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
  const { email, mobile } = route.params || {};
  const { loginWithToken } = useAuth();

  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // 30-second cooldown timer matching brief requirement
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
      const res = await apiClient.post("/auth/verify-otp", {
        email,
        code: otpCode.trim(),
      });

      if (res.data?.success) {
        const { token, user } = res.data.data;
        await loginWithToken(token, user);

        // First-login profile check
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
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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

          <InputField
            label="6-digit code"
            value={otpCode}
            onChangeText={(text) => {
              setOtpCode(text.replace(/[^0-9]/g, "").slice(0, 6));
              if (error) setError(null);
            }}
            placeholder="- - - - - -"
            keyboardType="number-pad"
            maxLength={6}
            style={styles.otpInput}
          />

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
  otpInput: {
    fontSize: 24,
    letterSpacing: 10,
    textAlign: "left",
    fontWeight: "700",
  },
  resendWrapper: {
    alignSelf: "flex-start",
    marginTop: 4,
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
