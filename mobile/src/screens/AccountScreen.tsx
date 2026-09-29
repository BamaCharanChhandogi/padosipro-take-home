import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/Button";

interface AccountScreenProps {
  navigation: any;
}

export const AccountScreen: React.FC<AccountScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          try {
            setLoggingOut(true);
            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: "Welcome" }],
            });
          } catch (err) {
            console.error("Logout error", err);
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  const profile = user?.profile;
  const phoneNumber = profile?.phone || user?.mobile || "+91 9876543210";
  const userCity = profile?.city || "Mumbai";
  const userName = profile?.fullName || "User";
  const flatDetails = profile?.flatUnit ? `Flat / unit: ${profile.flatUnit}` : "Residence";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {/* Back Navigation */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={18} color={Colors.primaryGreen} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Account</Text>

          {/* Signed in as Card */}
          <View style={styles.infoCard}>
            <Text style={styles.cardLabel}>Signed in as</Text>
            <Text style={styles.cardValue}>{phoneNumber}</Text>
          </View>

          {/* Your LM Card */}
          <View style={styles.infoCard}>
            <Text style={styles.cardLabel}>Your LM</Text>
            <Text style={styles.cardValue}>Pilot LM</Text>
            <Text style={styles.cardSubText}>{userCity}</Text>
            <Text style={styles.cardSubText}>{userName}</Text>
            <Text style={styles.cardSubText}>{flatDetails}</Text>
          </View>

          {/* Household Card */}
          <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
            <View style={styles.actionCardLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="people-outline" size={20} color={Colors.primaryGreen} />
              </View>
              <View>
                <Text style={styles.actionTitle}>Household</Text>
                <Text style={styles.actionSub}>Family members your LM should know about</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          {/* Wallet Card */}
          <View style={styles.infoCard}>
            <Text style={styles.cardLabel}>Wallet</Text>
            <Text style={styles.cardValue}>Coming soon</Text>
            <Text style={styles.walletDesc}>
              Wallet top-up isn't turned on yet. Your Lifestyle Manager can still handle requests
              and send you the bill directly in the meantime.
            </Text>
          </View>

          {/* Sign Out Button matching media_1790651548688.png */}
          <View style={styles.buttonWrapper}>
            <Button
              title="Sign out"
              variant="dangerOutline"
              onPress={handleLogout}
              loading={loggingOut}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.darkBg,
  },
  scrollContent: {
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
  },
  backText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primaryGreen,
    marginLeft: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  cardSubText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  actionCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  actionSub: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  walletDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: 6,
  },
  buttonWrapper: {
    marginTop: 12,
  },
});
