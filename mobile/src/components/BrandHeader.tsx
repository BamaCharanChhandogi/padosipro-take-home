import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme";

export const BrandHeader: React.FC<{ showSubtitle?: boolean }> = ({ showSubtitle = true }) => {
  return (
    <View style={styles.container}>
      <View style={styles.logoTile}>
        <Ionicons name="home" size={20} color="#6EE7B7" />
      </View>
      {showSubtitle && <Text style={styles.brandTitle}>PadosiPro</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    alignItems: "flex-start",
  },
  logoTile: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primaryGreenDark,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  brandTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
});
