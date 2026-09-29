import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
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
  const [mobile, setMobile] = useState("6295474539");
  const [email, setEmail] = useState("b.c.chhandogi@gmail.com");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetOtp = async () => {
    setError(null);
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    const cleanMobile = mobile.trim();
    if (cleanMobile && !/^\d{10}$/.test(cleanMobile)) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    try {
      setLoading(true);
      const res = await apiClient.post("/auth/request-otp", {
        email: email.trim(),
        mobile: cleanMobile ? `+91${cleanMobile}` : undefined,
      });

      if (res.data?.success) {
        navigation.navigate("OtpVerification", {
          email: email.trim(),
          mobile: cleanMobile,
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to send verification code. Please try again.");
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
        >
          {/* Main Card */}
          <View style={styles.card}>
            <BrandHeader showSubtitle={true} />

            <Text style={styles.title}>Welcome</Text>
            <Text style={styles.subtitle}>
              Enter your mobile number and email. We'll send the OTP to your email.
            </Text>

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={Colors.errorText} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <InputField
              label="Mobile number"
              prefix="+91"
              value={mobile}
              onChangeText={setMobile}
              placeholder="e.g. 9876543210"
              keyboardType="phone-pad"
              leftIcon={<Ionicons name="call-outline" size={18} color={Colors.textSecondary} />}
            />

            <InputField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
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
  buttonWrapper: {
    marginTop: 20,
  },
});
