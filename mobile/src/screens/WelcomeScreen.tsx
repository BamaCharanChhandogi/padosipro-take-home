import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme";
import { BrandHeader } from "../components/BrandHeader";
import { InputField } from "../components/InputField";
import { Button } from "../components/Button";
import { apiClient, setApiBaseUrl, LAN_API_URL, PUBLIC_API_URL } from "../api/client";

interface WelcomeScreenProps {
  navigation: any;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const [mobile, setMobile] = useState("6295474539");
  const [email, setEmail] = useState("b.c.chhandogi@gmail.com");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [customServerUrl, setCustomServerUrl] = useState(apiClient.defaults.baseURL || LAN_API_URL);

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
      setError(err.message || "Failed to connect to backend. Please check connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveServerUrl = async (url: string) => {
    await setApiBaseUrl(url);
    setCustomServerUrl(url);
    setShowSettings(false);
    setError(null);
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
          {/* Top Bar with Settings Gear */}
          <View style={styles.topBar}>
            <BrandHeader showSubtitle={true} />
            <TouchableOpacity
              style={styles.gearButton}
              onPress={() => setShowSettings(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="settings-outline" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
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
                <View style={{ flex: 1 }}>
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity onPress={() => setShowSettings(true)}>
                    <Text style={styles.errorAction}>Tap here to switch backend server URL</Text>
                  </TouchableOpacity>
                </View>
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

      {/* Backend Connection Modal for Seamless Device Switching */}
      <Modal visible={showSettings} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Backend Server Connection</Text>
            <Text style={styles.modalDesc}>
              Select the active backend API address depending on whether your phone is on the same Wi-Fi or mobile data:
            </Text>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => handleSaveServerUrl(LAN_API_URL)}
            >
              <Text style={styles.optionTitle}>Wi-Fi LAN IP (Recommended for Home Wi-Fi)</Text>
              <Text style={styles.optionSub}>{LAN_API_URL}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => handleSaveServerUrl(PUBLIC_API_URL)}
            >
              <Text style={styles.optionTitle}>Public Cloud Tunnel (For Mobile Data / Remote)</Text>
              <Text style={styles.optionSub}>{PUBLIC_API_URL}</Text>
            </TouchableOpacity>

            <View style={{ marginTop: 12 }}>
              <Text style={styles.fieldLabel}>Custom Server URL:</Text>
              <TextInput
                style={styles.modalInput}
                value={customServerUrl}
                onChangeText={setCustomServerUrl}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Use Custom URL"
                onPress={() => handleSaveServerUrl(customServerUrl)}
                style={{ marginBottom: 8 }}
              />
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setShowSettings(false)}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 8,
  },
  gearButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
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
    alignItems: "flex-start",
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
  },
  errorAction: {
    color: Colors.primaryGreen,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
    textDecorationLine: "underline",
  },
  buttonWrapper: {
    marginTop: 28,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  optionButton: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 10,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primaryGreen,
    marginBottom: 2,
  },
  optionSub: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 16,
  },
  modalActions: {
    marginTop: 8,
  },
});
