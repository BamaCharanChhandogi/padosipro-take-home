import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme";
import { useAuth } from "../context/AuthContext";
import { apiClient } from "../api/client";
import { UserSelectedTask } from "../types";

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [selectedTasks, setSelectedTasks] = useState<UserSelectedTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const userName = user?.profile?.fullName || user?.email?.split("@")[0] || "Bama";

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/tasks/my-tasks");
      if (res.data?.success) {
        setSelectedTasks(res.data.data);
      }
    } catch (err) {
      console.warn("Error fetching user tasks", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyTasks();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // WhatsApp Lifestyle Manager redirect with personalized task context
  const handleOpenWhatsAppChat = () => {
    const whatsappNumber = "916295474539";
    const tasksList =
      selectedTasks.length > 0
        ? selectedTasks.map((t) => t.name).join(", ")
        : "household errands";
    const greetingMsg = encodeURIComponent(
      `Hi Pilot LM! I'm ${userName} from PadosiPro. I just submitted: ${tasksList}. Looking forward to coordinating with you!`
    );
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${greetingMsg}`;

    Linking.openURL(whatsappUrl).catch((err) => {
      console.warn("Could not open WhatsApp URL:", err);
    });
  };

  const categoriesChips = [
    { title: "Errands & Daily Tasks", icon: "checkbox-outline" },
    { title: "Home Services", icon: "home-outline" },
    { title: "Travel & Tourism", icon: "location-outline" },
    { title: "Health & Medical", icon: "heart-outline" },
    { title: "Senior Care", icon: "people-outline" },
    { title: "Events & Management", icon: "calendar-outline" },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primaryGreen} />
        }
      >
        {/* Header - Matching media_1790688931153.png (Good evening, [name]) */}
        <View style={styles.headerRow}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingHeader}>
              {getGreeting()}, {userName}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => navigation.navigate("Account")}
            activeOpacity={0.8}
          >
            <Ionicons name="person-outline" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Search Section */}
        <Text style={styles.sectionTitle}>What do you need help with?</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="AC leaking, cook for weekends..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => {
              if (searchQuery.trim()) {
                navigation.navigate("TaskSelection", { initialSearch: searchQuery.trim() });
              }
            }}
            returnKeyType="search"
          />
          {searchQuery.trim().length > 0 && (
            <TouchableOpacity
              onPress={() => {
                navigation.navigate("TaskSelection", { initialSearch: searchQuery.trim() });
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-forward-circle" size={22} color={Colors.primaryGreen} />
            </TouchableOpacity>
          )}
        </View>

        {/* Popular Categories Chips */}
        <Text style={styles.subHeading}>POPULAR WITH FAMILIES LIKE YOURS</Text>
        <View style={styles.chipsWrap}>
          {categoriesChips.map((chip, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.categoryChip}
              onPress={() => navigation.navigate("TaskSelection", { initialSearch: chip.title })}
              activeOpacity={0.7}
            >
              <Ionicons name={chip.icon as any} size={15} color={Colors.primaryGreen} style={{ marginRight: 6 }} />
              <Text style={styles.chipText}>{chip.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Browse everything link */}
        <TouchableOpacity
          style={styles.browseLink}
          onPress={() => navigation.navigate("TaskSelection")}
          activeOpacity={0.7}
        >
          <Text style={styles.browseLinkText}>Browse everything we do</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.primaryGreen} style={{ marginLeft: 4 }} />
        </TouchableOpacity>

        {/* Selected Tasks Display */}
        {selectedTasks.length > 0 && (
          <View style={styles.tasksSection}>
            <View style={styles.tasksSectionHeader}>
              <Text style={styles.subHeading}>YOUR CURRENT REQUESTS ({selectedTasks.length})</Text>
              <TouchableOpacity onPress={() => navigation.navigate("TaskSelection")}>
                <Text style={styles.editTasksLink}>+ Add more</Text>
              </TouchableOpacity>
            </View>
            {selectedTasks.map((t) => (
              <View key={t.id} style={styles.selectedTaskCard}>
                <View style={styles.taskBadge}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.primaryGreen} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectedTaskName}>{t.name}</Text>
                  <Text style={styles.selectedTaskCat}>{t.categoryName}</Text>
                </View>
                <View style={styles.statusChip}>
                  <Text style={styles.statusChipText}>Assigned</Text>
                </View>
              </View>
            ))}

            {/* Live Progress Stepper */}
            <View style={styles.trackerCard}>
              <View style={styles.trackerHeader}>
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <Text style={styles.trackerTitle}>LIVE COORDINATION</Text>
                </View>
                <Text style={styles.etaText}>Today, within 2 hrs</Text>
              </View>
              <View style={styles.stepperRow}>
                <View style={styles.stepNode}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.primaryGreen} />
                  <Text style={styles.stepNodeText}>Submitted</Text>
                </View>
                <View style={styles.stepConnectorActive} />
                <View style={styles.stepNode}>
                  <Ionicons name="radio-button-on" size={18} color={Colors.amberAccent} />
                  <Text style={styles.stepNodeText}>Assigned</Text>
                </View>
                <View style={styles.stepConnector} />
                <View style={styles.stepNode}>
                  <Ionicons name="ellipse-outline" size={18} color={Colors.textMuted} />
                  <Text style={styles.stepNodeTextMuted}>In Progress</Text>
                </View>
                <View style={styles.stepConnector} />
                <View style={styles.stepNode}>
                  <Ionicons name="ellipse-outline" size={18} color={Colors.textMuted} />
                  <Text style={styles.stepNodeTextMuted}>Done</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* How PadosiPro Works */}
        <Text style={[styles.subHeading, { marginTop: 20 }]}>HOW PADOSIPRO WORKS</Text>
        <View style={styles.stepsList}>
          <View style={styles.stepItem}>
            <View style={styles.stepIconBox}>
              <Ionicons name="chatbubble-outline" size={18} color={Colors.primaryGreen} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Tell us what you need</Text>
              <Text style={styles.stepDesc}>In your own words. No forms to hunt through.</Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepIconBox}>
              <Ionicons name="person-outline" size={18} color={Colors.primaryGreen} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Your Lifestyle Manager takes it on</Text>
              <Text style={styles.stepDesc}>One person who knows your family and follows it through.</Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepIconBox}>
              <Ionicons name="checkmark-done-outline" size={18} color={Colors.primaryGreen} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>You see it done</Text>
              <Text style={styles.stepDesc}>Updates as things actually happen, with proof when it matters.</Text>
            </View>
          </View>
        </View>

        {/* Your Lifestyle Manager Card with WhatsApp Integration */}
        <View style={styles.lmCard}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={styles.lmSub}>Your Dedicated Lifestyle Manager</Text>
            <Text style={styles.lmName}>Pilot LM</Text>
            <Text style={styles.lmStatus}>● Online & Coordinating</Text>
          </View>
          <TouchableOpacity
            style={styles.chatButton}
            onPress={handleOpenWhatsAppChat}
            activeOpacity={0.7}
          >
            <Ionicons name="logo-whatsapp" size={18} color={Colors.white} />
            <Text style={styles.chatText}>Chat</Text>
          </TouchableOpacity>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 16,
  },
  greetingContainer: {
    flex: 1,
  },
  greetingHeader: {
    fontSize: 22,
    fontWeight: "600",
    color: "#101828", // Verified from WhatFont media_1790688931153.png
    lineHeight: 29,
    letterSpacing: -0.3,
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 24,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  subHeading: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipText: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  browseLink: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 24,
  },
  browseLinkText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primaryGreen,
  },
  tasksSection: {
    marginBottom: 24,
  },
  tasksSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  editTasksLink: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primaryGreen,
    marginBottom: 12,
  },
  selectedTaskCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  taskBadge: {
    marginRight: 12,
  },
  selectedTaskName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  selectedTaskCat: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusChip: {
    backgroundColor: Colors.mintSelectedBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusChipText: {
    color: Colors.primaryGreen,
    fontSize: 11,
    fontWeight: "700",
  },
  trackerCard: {
    backgroundColor: "#F8FAF9",
    borderWidth: 1,
    borderColor: "#D1E7DD",
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
  },
  trackerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primaryGreen,
  },
  trackerTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primaryGreen,
    letterSpacing: 0.6,
  },
  etaText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepNode: {
    alignItems: "center",
    gap: 4,
  },
  stepNodeText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  stepNodeTextMuted: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.cardBorder,
    marginBottom: 14,
    marginHorizontal: 4,
  },
  stepConnectorActive: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.primaryGreen,
    marginBottom: 14,
    marginHorizontal: 4,
  },
  stepsList: {
    gap: 16,
    marginBottom: 24,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  stepIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  lmCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    borderRadius: 16,
    padding: 18,
  },
  lmSub: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: "600",
    marginBottom: 2,
  },
  lmName: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  lmStatus: {
    fontSize: 11,
    color: Colors.primaryGreen,
    fontWeight: "600",
    marginTop: 3,
  },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#25D366", // Authentic WhatsApp brand green
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },
  chatText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.white,
  },
});
