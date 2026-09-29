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
          devOtp: res.data?.data?.otpCode,
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
              label="Mobile number"
              prefix="+91"
              value={mobile}
              onChangeText={setMobile}
              placeholder="6295474539"
              keyboardType="phone-pad"
              leftIcon={<Ionicons name="call-outline" size={18} color={Colors.textSecondary} />}
            />

            <InputField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="b.c.chhandogi@gmail.com"
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
