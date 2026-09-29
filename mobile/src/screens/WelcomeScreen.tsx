import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
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

interface WelcomeScreenProps {
  navigation: any;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetOtp = async () => {
    setError(null);
    const cleanEmail = email.trim().toLowerCase();

    // 1. Email validation: required & must be valid format
    if (!cleanEmail) {
      setError("Please enter your email address to receive OTP");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError("Please enter a valid email address (e.g. name@example.com)");
      return;
    }

    // 2. Mobile validation: optional, but if entered, must be valid 10 digits
    let cleanMobile = mobile.replace(/\D/g, "");
    if (cleanMobile.startsWith("91") && cleanMobile.length === 12) {
      cleanMobile = cleanMobile.slice(2);
    } else if (cleanMobile.startsWith("0") && cleanMobile.length === 11) {
      cleanMobile = cleanMobile.slice(1);
    }

    if (cleanMobile.length > 0) {
      if (cleanMobile.length !== 10 || !/^[6-9]\d{9}$/.test(cleanMobile)) {
        setError("Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)");
        return;
      }
    }

    try {
      setLoading(true);
      const res = await apiClient.post("/auth/request-otp", {
        email: cleanEmail,
        mobile: cleanMobile ? `+91${cleanMobile}` : undefined,
      });

      if (res.data?.success) {
        navigation.navigate("OtpVerification", {
          email: cleanEmail,
          mobile: cleanMobile || undefined,
        });
      }
    } catch (err: any) {
      setError(err.message || "Unable to reach server. Please check your connection.");
    } finally {
      setLoading(false);
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
          {/* Brand Logo & Name */}
          <View style={styles.topBar}>
            <BrandHeader showSubtitle={true} />
          </View>

          {/* Screen Content */}
          <View style={styles.content}>
            <Text style={styles.title}>Welcome</Text>
            <Text style={styles.subtitle}>
              Enter your mobile number and email. We'll send the OTP to your email.
            </Text>

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={20} color={Colors.errorText} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <InputField
              label="Mobile number (optional)"
              prefix="+91"
              value={mobile}
              onChangeText={(text) => {
                setMobile(text);
                if (error) setError(null);
              }}
              placeholder="9876543210"
              keyboardType="phone-pad"
              maxLength={13}
              leftIcon={<Ionicons name="call-outline" size={18} color={Colors.textSecondary} />}
            />

            <InputField
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError(null);
              }}
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              leftIcon={<Ionicons name="mail-outline" size={18} color={Colors.textSecondary} />}
            />

            <View style={styles.buttonWrapper}>
              <Button
                title={loading ? "Sending OTP..." : "Get OTP"}
                onPress={handleGetOtp}
                loading={loading}
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
    justifyContent: "space-between",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    width: "100%",
    marginBottom: 8,
  },
  content: {
    flex: 1,
    justifyContent: "flex-start",
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
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.errorBg,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    gap: 10,
  },
  errorText: {
    color: Colors.errorText,
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  buttonWrapper: {
    marginTop: 24,
  },
});
