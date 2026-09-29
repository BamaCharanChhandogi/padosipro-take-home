import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

/**
 * StorageAdapter provides a unified, fail-safe storage solution.
 * Uses SecureStore on native devices (iOS/Android) for secure token storage,
 * with graceful fallback to AsyncStorage or in-memory map to guarantee ZERO null-pointer crashes.
 */
class MemoryStorage {
  private store: Map<string, string> = new Map();

  async getItem(key: string): Promise<string | null> {
    return this.store.get(key) || null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }
}

const memoryFallback = new MemoryStorage();

export const Storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS !== "web") {
        const isAvailable = await SecureStore.isAvailableAsync();
        if (isAvailable) {
          const val = await SecureStore.getItemAsync(key);
          if (val !== null) return val;
        }
      }
    } catch (e) {
      // Fall through to AsyncStorage
    }

    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      return await memoryFallback.getItem(key);
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS !== "web") {
        const isAvailable = await SecureStore.isAvailableAsync();
        if (isAvailable) {
          await SecureStore.setItemAsync(key, value);
          return;
        }
      }
    } catch (e) {
      // Fall through
    }

    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      await memoryFallback.setItem(key, value);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS !== "web") {
        const isAvailable = await SecureStore.isAvailableAsync();
        if (isAvailable) {
          await SecureStore.deleteItemAsync(key);
        }
      }
    } catch (e) {
      // Fall through
    }

    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      await memoryFallback.removeItem(key);
    }
  },
};
