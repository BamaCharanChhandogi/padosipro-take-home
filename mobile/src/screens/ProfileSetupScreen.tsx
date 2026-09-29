import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../theme";
import { InputField } from "../components/InputField";
import { Button } from "../components/Button";
import { apiClient } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface ProfileSetupScreenProps {
  navigation: any;
}

export const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({ navigation }) => {
  const { user, updateUserProfile } = useAuth();

  const [fullName, setFullName] = useState(user?.profile?.fullName || "");
  const [addressArea, setAddressArea] = useState(user?.profile?.addressArea || "");
  const [society, setSociety] = useState(user?.profile?.society || "");
  const [flatUnit, setFlatUnit] = useState(user?.profile?.flatUnit || "");
  const [entryNotes, setEntryNotes] = useState(user?.profile?.entryNotes || "");
  const [businessName, setBusinessName] = useState(user?.profile?.businessName || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic inline validation helper matching screenshot
  const getValidationHint = () => {
    if (!fullName.trim()) return "Enter your full name to continue.";
    if (!addressArea.trim()) return "Enter your address & area to continue.";
    if (addressArea.trim().length < 3) return "Address & area must be at least 3 characters.";
    return null;
  };

  const validationHint = getValidationHint();
  const canContinue = !validationHint;

  const handleSaveProfile = async () => {
    if (!canContinue) return;

    try {
      setLoading(true);
      setError(null);

      const phoneToUse = user?.mobile || "+916295474539";

      const res = await apiClient.post("/profile", {
        fullName: fullName.trim(),
        phone: phoneToUse,
        addressArea: addressArea.trim(),
        society: society.trim() || undefined,
        flatUnit: flatUnit.trim() || undefined,
        entryNotes: entryNotes.trim() || undefined,
        businessName: businessName.trim() || undefined,
        city: "Mumbai",
      });

      if (res.data?.success) {
        updateUserProfile(res.data.data);
        navigation.reset({
          index: 1,
          routes: [{ name: "Home" }, { name: "TaskSelection" }],
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to save profile details.");
    } finally {
      setLoading(false);
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
          {/* City Tag matching screenshot */}
          <Text style={styles.cityTag}>Mumbai</Text>

          <Text style={styles.title}>A few details</Text>
          <Text style={styles.subtitle}>
            So your Lifestyle Manager can coordinate visits and deliveries smoothly.
          </Text>

          {error && <Text style={styles.serverError}>{error}</Text>}

          <InputField
            label="Full name"
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              if (error) setError(null);
            }}
            placeholder="As you would like us to use"
          />

          <InputField
            label="Address & area"
            value={addressArea}
            onChangeText={(text) => {
              setAddressArea(text);
              if (error) setError(null);
            }}
            placeholder="Road, area, landmark"
          />

          <InputField
            label="Society / building (optional)"
            value={society}
            onChangeText={setSociety}
            placeholder="Name as on the gate"
          />

          <InputField
            label="Flat / unit (optional)"
            value={flatUnit}
            onChangeText={setFlatUnit}
            placeholder="e.g. Tower B, 1204"
          />

          <InputField
            label="Gate or entry notes (optional)"
            value={entryNotes}
            onChangeText={setEntryNotes}
            placeholder="Anything the team should know at entry"
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />

          <InputField
            label="Business name (optional)"
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="Optional: Company or firm name"
          />

          {/* Inline validation hint matching screenshot */}
          {validationHint ? (
            <Text style={styles.validationHint}>{validationHint}</Text>
          ) : null}

          <View style={styles.buttonWrapper}>
            <Button
              title={loading ? "Saving..." : "Continue"}
              onPress={handleSaveProfile}
              disabled={!canContinue}
              loading={loading}
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
    paddingTop: 16,
    paddingBottom: 40,
  },
  cityTag: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.amberTag,
    marginBottom: 6,
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
    marginBottom: 24,
  },
  serverError: {
    color: Colors.errorText,
    fontSize: 13,
    marginBottom: 12,
    backgroundColor: Colors.errorBg,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: "top",
  },
  validationHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 16,
  },
  buttonWrapper: {
    marginTop: 8,
  },
});
