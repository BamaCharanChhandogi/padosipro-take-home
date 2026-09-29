import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Local development IP detection
// For Android emulator: 10.0.2.2 points to host machine
// For physical device testing, user can configure or default to host LAN IP
const DEFAULT_HOST = Platform.OS === "android" ? "http://10.0.2.2:5000" : "http://localhost:5000";

export const API_BASE_URL = `${DEFAULT_HOST}/api`;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to inject JWT token
apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem("@padosipro_jwt_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.warn("Error reading auth token from storage", err);
  }
  return config;
});

// Response interceptor for consistent error extraction
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      "Unable to connect to the server. Please check your connection.";
    const code = error.response?.data?.error?.code || "NETWORK_ERROR";
    const customError = new Error(message);
    (customError as any).code = code;
    (customError as any).status = error.response?.status;
    return Promise.reject(customError);
  }
);
