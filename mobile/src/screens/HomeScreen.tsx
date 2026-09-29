import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
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

  const userName = user?.profile?.fullName || user?.email?.split("@")[0] || "there";

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
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.greetingText}>Good morning, {userName}</Text>
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
          />
        </View>

        {/* Popular Categories Chips */}
        <Text style={styles.subHeading}>POPULAR WITH FAMILIES LIKE YOURS</Text>
        <View style={styles.chipsWrap}>
          {categoriesChips.map((chip, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.categoryChip}
              onPress={() => navigation.navigate("TaskSelection")}
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
            <Text style={styles.subHeading}>YOUR CURRENT REQUESTS ({selectedTasks.length})</Text>
            {selectedTasks.map((t) => (
              <View key={t.id} style={styles.selectedTaskCard}>
                <View style={styles.taskBadge}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.primaryGreen} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectedTaskName}>{t.name}</Text>
                  <Text style={styles.selectedTaskCat}>{t.categoryName}</Text>
                </View>
              </View>
            ))}
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

        {/* Your Lifestyle Manager Card */}
        <View style={styles.lmCard}>
          <View>
            <Text style={styles.lmSub}>Your Lifestyle Manager</Text>
            <Text style={styles.lmName}>Pilot LM</Text>
          </View>
          <TouchableOpacity style={styles.chatButton} activeOpacity={0.7}>
            <Ionicons name="chatbox-ellipses-outline" size={16} color={Colors.primaryGreen} />
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
    marginBottom: 24,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  avatarButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F1F5F9",
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
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
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
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipText: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  browseLink: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 24,
  },
  browseLinkText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primaryGreen,
  },
  tasksSection: {
    marginBottom: 24,
  },
  selectedTaskCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  taskBadge: {
    marginRight: 12,
  },
  selectedTaskName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  selectedTaskCat: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
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
    width: 36,
    height: 36,
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
    fontWeight: "600",
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
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 14,
    padding: 18,
  },
  lmSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  lmName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  chatText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primaryGreen,
  },
});
