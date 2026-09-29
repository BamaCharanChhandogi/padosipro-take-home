import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
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
        >
          <View style={styles.card}>
            {/* Top Navigation */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={18} color={Colors.primaryGreen} />
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.darkBg,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 16,
  },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 16,
    gap: 2,
  },
  backText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primaryGreen,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 24,
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
    fontSize: 22,
    letterSpacing: 10,
    textAlign: "left",
    fontWeight: "600",
  },
  resendWrapper: {
    alignSelf: "flex-start",
    marginTop: 4,
    marginBottom: 20,
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
