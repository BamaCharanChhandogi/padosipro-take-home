import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme";
import { Button } from "../components/Button";
import { apiClient } from "../api/client";
import { Category } from "../types";

interface TaskSelectionScreenProps {
  navigation: any;
}

export const TaskSelectionScreen: React.FC<TaskSelectionScreenProps> = ({ navigation }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>("errands");
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get("/tasks/catalog");
      if (res.data?.success) {
        setCategories(res.data.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load services catalogue.");
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategoryId((prev) => (prev === categoryId ? null : categoryId));
  };

  const toggleTask = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleSaveTasks = async () => {
    if (selectedTaskIds.length === 0) return;

    try {
      setSubmitting(true);
      setError(null);
      await apiClient.post("/tasks/select", { taskIds: selectedTaskIds });
      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });
    } catch (err: any) {
      setError(err.message || "Failed to save selected tasks.");
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case "check-square":
        return <Ionicons name="checkbox-outline" size={20} color={Colors.primaryGreen} />;
      case "home":
        return <Ionicons name="home-outline" size={20} color={Colors.primaryGreen} />;
      case "map-pin":
        return <Ionicons name="location-outline" size={20} color={Colors.primaryGreen} />;
      case "heart":
        return <Ionicons name="heart-outline" size={20} color={Colors.primaryGreen} />;
      case "users":
        return <Ionicons name="people-outline" size={20} color={Colors.primaryGreen} />;
      case "calendar":
        return <Ionicons name="calendar-outline" size={20} color={Colors.primaryGreen} />;
      default:
        return <Ionicons name="list-outline" size={20} color={Colors.primaryGreen} />;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primaryGreen} />
        <Text style={styles.loadingText}>Loading catalogue...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color={Colors.primaryGreen} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>What do you need help with?</Text>
          <Text style={styles.subtitle}>
            Pick a category, then choose a service. You can add details next.
          </Text>

          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* Categories List */}
          {categories.map((category) => {
            const isExpanded = expandedCategoryId === category.id;

            return (
              <View
                key={category.id}
                style={[
                  styles.categoryCard,
                  isExpanded && styles.categoryCardExpanded,
                ]}
              >
                <TouchableOpacity
                  style={styles.categoryHeader}
                  onPress={() => toggleCategory(category.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.iconBox}>{getCategoryIcon(category.icon)}</View>
                  <View style={styles.categoryHeaderText}>
                    <Text style={styles.categoryTitle}>{category.name}</Text>
                    <Text style={styles.categoryDesc}>{category.description}</Text>
                  </View>
                </TouchableOpacity>

                {/* Expanded Sub-tasks ("WHAT KIND OF HELP?") matching screenshots */}
                {isExpanded && (
                  <View style={styles.subTasksContainer}>
                    <Text style={styles.subTasksHeader}>WHAT KIND OF HELP?</Text>
                    <View style={styles.pillsWrap}>
                      {category.tasks.map((task) => {
                        const isSelected = selectedTaskIds.includes(task.id);
                        return (
                          <TouchableOpacity
                            key={task.id}
                            style={[
                              styles.taskPill,
                              isSelected && styles.taskPillSelected,
                            ]}
                            onPress={() => toggleTask(task.id)}
                            activeOpacity={0.75}
                          >
                            <Text
                              style={[
                                styles.taskPillText,
                                isSelected && styles.taskPillTextSelected,
                              ]}
                            >
                              {task.name}
                            </Text>
                            {isSelected && (
                              <Ionicons
                                name="checkmark"
                                size={14}
                                color={Colors.white}
                                style={{ marginLeft: 4 }}
                              />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>

        {/* Sticky Bottom Bar matching screenshot */}
        <View style={styles.stickyFooter}>
          <Button
            title={
              submitting
                ? "Saving..."
                : selectedTaskIds.length > 0
                ? `Continue (${selectedTaskIds.length} selected)`
                : "Continue"
            }
            onPress={handleSaveTasks}
            disabled={selectedTaskIds.length === 0}
            loading={submitting}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.screenBg,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Colors.screenBg,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 110,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 16,
    gap: 4,
  },
  backText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.primaryGreen,
  },
  title: {
    fontSize: 30,
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
  errorText: {
    color: Colors.errorText,
    fontSize: 13,
    marginBottom: 12,
  },
  categoryCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 16,
    marginBottom: 14,
    overflow: "hidden",
  },
  categoryCardExpanded: {
    backgroundColor: Colors.mintSelectedBg,
    borderColor: Colors.primaryGreen,
    borderLeftWidth: 4,
    borderLeftColor: Colors.amberAccent,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  categoryHeaderText: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  categoryDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  subTasksContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  subTasksHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  pillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  taskPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  taskPillSelected: {
    backgroundColor: Colors.primaryGreen,
    borderColor: Colors.primaryGreen,
  },
  taskPillText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  taskPillTextSelected: {
    color: Colors.white,
  },
  stickyFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
});
