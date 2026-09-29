import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
  const phoneNumber = profile?.phone || user?.mobile || "+91 7719222741";
  const userCity = profile?.city || "Mumbai";
  const userName = profile?.fullName || "Bama Charan";
  const societyDetails = profile?.society || profile?.addressArea || "system";
  const flatDetails = profile?.flatUnit ? `Flat / unit: ${profile.flatUnit}` : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Back Navigation */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color={Colors.primaryGreen} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Account</Text>

        {/* Signed in as Card */}
        <View style={styles.infoCard}>
          <Text style={styles.cardLabel}>Signed in as</Text>
          <Text style={styles.cardValue}>{phoneNumber}</Text>
          {user?.email ? <Text style={styles.cardSubText}>{user.email}</Text> : null}
        </View>

        {/* Your LM Card */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardLabel}>Your LM</Text>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate("ProfileSetup")}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={14} color={Colors.primaryGreen} />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.cardValue}>Pilot LM</Text>
          <Text style={styles.cardSubText}>{userCity}</Text>
          {societyDetails ? <Text style={styles.cardSubText}>{societyDetails}</Text> : null}
          {flatDetails ? <Text style={styles.cardSubText}>{flatDetails}</Text> : null}
        </View>

        {/* Household Card */}
        <TouchableOpacity
          style={styles.actionCard}
          activeOpacity={0.7}
          onPress={() => {
            Alert.alert(
              "Household Members",
              "Manage household family members who can request and coordinate tasks with your Lifestyle Manager.",
              [
                { text: "Close", style: "cancel" },
                {
                  text: "Message LM on WhatsApp",
                  onPress: () => {
                    const whatsappNumber = "916295474539";
                    const msg = encodeURIComponent(
                      `Hi Pilot LM! I would like to coordinate household members for ${userName} (${phoneNumber}).`
                    );
                    Linking.openURL(`https://wa.me/${whatsappNumber}?text=${msg}`);
                  },
                },
              ]
            );
          }}
        >
          <View style={styles.actionCardLeft}>
            <View style={styles.iconCircle}>
              <Ionicons name="people-outline" size={20} color={Colors.primaryGreen} />
            </View>
            <View style={styles.actionTextContainer}>
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

        {/* Sign Out Button */}
        <View style={styles.buttonWrapper}>
          <Button
            title="Sign out"
            variant="dangerOutline"
            leftIcon={<Ionicons name="log-out-outline" size={18} color={Colors.dangerRed} />}
            onPress={handleLogout}
            loading={loggingOut}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.screenBg,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 16,
    gap: 4,
  },
  backText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.primaryGreen,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.mintSelectedBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primaryGreen,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
    letterSpacing: 0.6,
  },
  cardValue: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  cardSubText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 20,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 16,
  },
  actionCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.mintSelectedBg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  actionTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  actionSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  walletDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: 6,
  },
  buttonWrapper: {
    marginTop: 16,
  },
});
