import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme";
import { Button } from "../components/Button";
import { apiClient } from "../api/client";
import { Category } from "../types";

interface TaskSelectionScreenProps {
  navigation: any;
  route?: any;
}

export const TaskSelectionScreen: React.FC<TaskSelectionScreenProps> = ({ navigation, route }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<string[]>(["errands"]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState(route?.params?.initialSearch || "");
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customRequestText, setCustomRequestText] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Business Logic Modal: Task Details & Schedule Step
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [taskInstructions, setTaskInstructions] = useState("");
  const [preferredTiming, setPreferredTiming] = useState("Today, As soon as possible");

  useEffect(() => {
    if (route?.params?.initialSearch) {
      setSearchQuery(route.params.initialSearch);
    }
  }, [route?.params?.initialSearch]);

  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      setError(null);
      const [catRes, myTasksRes] = await Promise.allSettled([
        apiClient.get("/tasks/catalog"),
        apiClient.get("/tasks/my-tasks"),
      ]);

      if (catRes.status === "fulfilled" && catRes.value.data?.success) {
        const fetchedCats: Category[] = catRes.value.data.data;
        setCategories(fetchedCats);

        // Preload any existing selected tasks if user previously saved
        if (myTasksRes.status === "fulfilled" && myTasksRes.value.data?.success) {
          const existingTasks = myTasksRes.value.data.data;
          if (existingTasks && existingTasks.length > 0) {
            const existingIds = existingTasks.map((t: any) => t.id);
            setSelectedTaskIds(existingIds);

            // Expand categories that contain selected tasks
            const activeCatIds = fetchedCats
              .filter((c) => c.tasks.some((t) => existingIds.includes(t.id)))
              .map((c) => c.id);
            if (activeCatIds.length > 0) {
              setExpandedCategoryIds(activeCatIds);
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load services catalogue.");
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleTask = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("Home");
    }
  };

  const handleOpenConfirm = () => {
    if (selectedTaskIds.length === 0) return;
    setShowConfirmModal(true);
  };

  const handleFinalSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      await apiClient.post("/tasks/select", { taskIds: selectedTaskIds });
      setShowConfirmModal(false);
      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });
    } catch (err: any) {
      setError(err.message || "Failed to save selected tasks.");
      setShowConfirmModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case "check-square":
        return <Ionicons name="checkbox-outline" size={22} color={Colors.primaryGreen} />;
      case "home":
        return <Ionicons name="home-outline" size={22} color={Colors.primaryGreen} />;
      case "map-pin":
        return <Ionicons name="location-outline" size={22} color={Colors.primaryGreen} />;
      case "heart":
        return <Ionicons name="heart-outline" size={22} color={Colors.primaryGreen} />;
      case "users":
        return <Ionicons name="people-outline" size={22} color={Colors.primaryGreen} />;
      case "calendar":
        return <Ionicons name="calendar-outline" size={22} color={Colors.primaryGreen} />;
      default:
        return <Ionicons name="list-outline" size={22} color={Colors.primaryGreen} />;
    }
  };

  // Find names of selected tasks for the confirmation summary
  const allTasks = categories.flatMap((c) => c.tasks);
  const selectedTaskObjects = allTasks.filter((t) => selectedTaskIds.includes(t.id));

  // Real-time search filter
  const query = searchQuery.trim().toLowerCase();
  const filteredCategories = categories
    .map((cat) => {
      if (!query) return cat;
      const catMatches =
        cat.name.toLowerCase().includes(query) ||
        cat.description.toLowerCase().includes(query);
      const matchingTasks = cat.tasks.filter((t) =>
        t.name.toLowerCase().includes(query)
      );
      if (catMatches) {
        return cat;
      }
      if (matchingTasks.length > 0) {
        return {
          ...cat,
          tasks: matchingTasks,
        };
      }
      return null;
    })
    .filter(Boolean) as Category[];

  const isCategoryExpanded = (categoryId: string) => {
    if (query.length > 0) return true; // Auto-expand when searching
    return expandedCategoryIds.includes(categoryId);
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
          removeClippedSubviews={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color={Colors.primaryGreen} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>What do you need help with?</Text>
          <Text style={styles.subtitle}>
            Pick a category, then choose a service. You can add details next.
          </Text>

          {/* Real-time Search Input */}
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search services (e.g. AC, plumbing, bills)..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* Empty search state */}
          {filteredCategories.length === 0 && (
            <View style={styles.emptySearchCard}>
              <Ionicons name="search-outline" size={32} color={Colors.textMuted} />
              <Text style={styles.emptySearchTitle}>No matching services found</Text>
              <Text style={styles.emptySearchSub}>
                Don't worry! Your Pilot Lifestyle Manager can fulfill custom tasks and errands.
              </Text>
              <TouchableOpacity
                style={styles.customRequestBtn}
                onPress={() => setShowCustomModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle-outline" size={18} color={Colors.primaryGreen} />
                <Text style={styles.customRequestBtnText}>Add custom request</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Categories List */}
          {filteredCategories.map((category) => {
            const isExpanded = isCategoryExpanded(category.id);
            const categoryTaskIds = category.tasks.map((t) => t.id);
            const selectedCountInCategory = selectedTaskIds.filter((id) =>
              categoryTaskIds.includes(id)
            ).length;

            return (
              <View
                key={category.id}
                style={[
                  styles.categoryCard,
                  isExpanded && styles.categoryCardExpanded,
                ]}
              >
                {/* Visual left accent bar when active */}
                {isExpanded && <View style={styles.accentBar} pointerEvents="none" />}

                <TouchableOpacity
                  style={styles.categoryHeader}
                  onPress={() => toggleCategory(category.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconBox, isExpanded && styles.iconBoxExpanded]}>
                    {getCategoryIcon(category.icon)}
                  </View>
                  <View style={styles.categoryHeaderText}>
                    <View style={styles.titleRow}>
                      <Text
                        style={[
                          styles.categoryTitle,
                          isExpanded && styles.categoryTitleExpanded,
                        ]}
                      >
                        {category.name}
                      </Text>
                      {selectedCountInCategory > 0 && (
                        <View style={styles.countBadge}>
                          <Text style={styles.countBadgeText}>
                            {selectedCountInCategory} selected
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.categoryDesc}>{category.description}</Text>
                  </View>
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={isExpanded ? Colors.primaryGreen : Colors.textMuted}
                    style={{ marginLeft: 8 }}
                  />
                </TouchableOpacity>

                {/* Sub-tasks section */}
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
                                style={{ marginLeft: 6 }}
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

          {/* Custom Errand Card */}
          <TouchableOpacity
            style={styles.customHelpCard}
            onPress={() => setShowCustomModal(true)}
            activeOpacity={0.8}
          >
            <View style={styles.customHelpLeft}>
              <View style={styles.customIconBox}>
                <Ionicons name="sparkles-outline" size={20} color={Colors.primaryGreen} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.customHelpTitle}>Need something else?</Text>
                <Text style={styles.customHelpSub}>
                  Tell your Pilot LM directly — anything from pet sitting to key pickups.
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </ScrollView>

        {/* Sticky Bottom Bar */}
        <View style={styles.stickyFooter}>
          <Button
            title={
              submitting
                ? "Saving..."
                : selectedTaskIds.length > 0
                ? `Continue (${selectedTaskIds.length} service${selectedTaskIds.length > 1 ? "s" : ""} selected)`
                : "Select at least 1 service to continue"
            }
            onPress={handleOpenConfirm}
            disabled={selectedTaskIds.length === 0}
            loading={submitting}
          />
        </View>
      </View>

      {/* Business Flow Modal: Task Details & Schedule */}
      <Modal visible={showConfirmModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>Confirm Your Requests</Text>
                <Text style={styles.modalSubtitle}>
                  Your Lifestyle Manager (Pilot LM) will coordinate these tasks.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowConfirmModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.selectedTasksHeader}>SELECTED SERVICES ({selectedTaskObjects.length}):</Text>
              {selectedTaskObjects.map((t) => (
                <View key={t.id} style={styles.confirmTaskRow}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.primaryGreen} />
                  <Text style={styles.confirmTaskText}>{t.name}</Text>
                </View>
              ))}

              <Text style={[styles.selectedTasksHeader, { marginTop: 16 }]}>WHEN SHOULD WE START?</Text>
              <View style={styles.timingRow}>
                {["Today, ASAP", "Tomorrow Morning", "This Weekend"].map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.timingChip,
                      preferredTiming === opt && styles.timingChipSelected,
                    ]}
                    onPress={() => setPreferredTiming(opt)}
                  >
                    <Text
                      style={[
                        styles.timingText,
                        preferredTiming === opt && styles.timingTextSelected,
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.selectedTasksHeader, { marginTop: 16 }]}>ADD SPECIFIC NOTES (OPTIONAL):</Text>
              <TextInput
                style={styles.instructionsInput}
                placeholder="e.g. Please send someone experienced with Daikin AC repair..."
                placeholderTextColor={Colors.textMuted}
                value={taskInstructions}
                onChangeText={setTaskInstructions}
                multiline
                numberOfLines={2}
              />
            </ScrollView>

            <View style={styles.modalFooterActions}>
              <Button
                title={submitting ? "Confirming..." : "Confirm & Send to Pilot LM"}
                onPress={handleFinalSubmit}
                loading={submitting}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Custom Request Modal */}
      <Modal visible={showCustomModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>Custom Errand Request</Text>
                <Text style={styles.modalSubtitle}>
                  Describe what you need. Pilot LM will coordinate it immediately.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowCustomModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.customTextInput}
              placeholder="e.g. Need help collecting dry cleaning, picking up spare keys, or arranging a technician..."
              placeholderTextColor={Colors.textMuted}
              value={customRequestText}
              onChangeText={setCustomRequestText}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalFooterActions}>
              <Button
                title="Send via WhatsApp to Pilot LM"
                onPress={() => {
                  const whatsappNumber = "916295474539";
                  const reqText = customRequestText.trim() || "Special custom request";
                  const msg = encodeURIComponent(
                    `Hi Pilot LM! I have a custom request: ${reqText}`
                  );
                  setShowCustomModal(false);
                  setCustomRequestText("");
                  Linking.openURL(`https://wa.me/${whatsappNumber}?text=${msg}`);
                }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    fontSize: 16,
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
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 18,
    gap: 10,
  },
  searchIcon: {
    marginRight: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    height: "100%",
  },
  emptySearchCard: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    marginTop: 8,
  },
  emptySearchTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: 10,
    marginBottom: 6,
  },
  emptySearchSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  customRequestBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.mintSelectedBg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  customRequestBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primaryGreen,
  },
  customHelpCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: "#D1E7DD",
    borderRadius: 16,
    padding: 16,
    marginTop: 6,
    marginBottom: 20,
  },
  customHelpLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
    marginRight: 10,
  },
  customIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.mintSelectedBg,
    alignItems: "center",
    justifyContent: "center",
  },
  customHelpTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  customHelpSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  customTextInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: Colors.textPrimary,
    minHeight: 100,
    textAlignVertical: "top",
    marginTop: 12,
    marginBottom: 16,
  },
  errorText: {
    color: Colors.errorText,
    fontSize: 13,
    marginBottom: 12,
  },
  categoryCard: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    borderRadius: 16,
    marginBottom: 14,
    position: "relative",
    // NOTE: Intentionally no overflow: "hidden" here to prevent Android ReactViewGroup clipping bug on siblings
  },
  categoryCardExpanded: {
    backgroundColor: "#F4FBF7",
    borderColor: Colors.primaryGreen,
  },
  accentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: Colors.amberAccent,
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 15,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    minHeight: 76,
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
  iconBoxExpanded: {
    backgroundColor: "#E8F5E9",
  },
  categoryHeaderText: {
    flex: 1,
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    flexWrap: "wrap",
    gap: 6,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  categoryTitleExpanded: {
    color: Colors.primaryGreen,
  },
  countBadge: {
    backgroundColor: Colors.primaryGreen,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  countBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: "700",
  },
  categoryDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  subTasksContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(30, 77, 43, 0.08)",
  },
  subTasksHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primaryGreen,
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 8,
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
    borderWidth: 1.5,
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
    fontWeight: "600",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  modalTitleContainer: {
    flex: 1,
    paddingRight: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  selectedTasksHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  confirmTaskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  confirmTaskText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  timingRow: {
    flexDirection: "row",
    gap: 8,
  },
  timingChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: "#F8FAFC",
  },
  timingChipSelected: {
    backgroundColor: Colors.mintSelectedBg,
    borderColor: Colors.primaryGreen,
  },
  timingText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  timingTextSelected: {
    color: Colors.primaryGreen,
    fontWeight: "700",
  },
  instructionsInput: {
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    minHeight: 56,
    textAlignVertical: "top",
  },
  modalFooterActions: {
    marginTop: 20,
  },
});
