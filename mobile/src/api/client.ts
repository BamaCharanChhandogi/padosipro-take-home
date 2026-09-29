import axios from "axios";
import { Platform } from "react-native";
import { Storage } from "../utils/storage";

// Configuration for API Host:
// 1. Production / Public Tunnel (Localtunnel or deployed URL)
// 2. Local Wi-Fi LAN IP (192.168.0.101:5000) for real physical phone on same Wi-Fi
// 3. Android Emulator (10.0.2.2:5000)
// 4. Fallback localhost:5000

export const PUBLIC_API_URL = "https://loose-heads-leave.loca.lt/api";
export const LAN_API_URL = "http://192.168.0.101:5000/api";
export const EMULATOR_API_URL = "http://10.0.2.2:5000/api";

// Default to LAN URL which is ultra-fast and direct when phone & computer are on same Wi-Fi,
// with automatic fallback to public tunnel if LAN fails.
let currentBaseUrl = LAN_API_URL;

export const apiClient = axios.create({
  baseURL: currentBaseUrl,
  timeout: 12000,
  headers: {
    "Content-Type": "application/json",
    // Localtunnel bypass header so it never shows tunnel interstitial page
    "Bypass-Tunnel-Reminder": "true",
  },
});

// Allow dynamic server endpoint switching (e.g. from debug gear icon or settings)
export async function setApiBaseUrl(newUrl: string) {
  currentBaseUrl = newUrl;
  apiClient.defaults.baseURL = newUrl;
  await Storage.setItem("@padosipro_api_url", newUrl);
}

// Load custom API URL if previously saved
Storage.getItem("@padosipro_api_url").then((savedUrl) => {
  if (savedUrl) {
    currentBaseUrl = savedUrl;
    apiClient.defaults.baseURL = savedUrl;
  }
});

// Request interceptor to inject JWT token
apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await Storage.getItem("@padosipro_jwt_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.warn("Error reading auth token from storage", err);
  }
  return config;
});

// Response interceptor with automatic failover between LAN and Public Tunnel
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If network failed on LAN, try the public tunnel URL automatically once!
    if (
      !error.response &&
      !originalRequest._retry &&
      currentBaseUrl === LAN_API_URL
    ) {
      originalRequest._retry = true;
      currentBaseUrl = PUBLIC_API_URL;
      apiClient.defaults.baseURL = PUBLIC_API_URL;
      originalRequest.baseURL = PUBLIC_API_URL;
      try {
        return await apiClient(originalRequest);
      } catch (retryErr) {
        // Continue to normal error handling below
      }
    }

    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      "Unable to connect to the server. Please check your backend connection.";
    const code = error.response?.data?.error?.code || "NETWORK_ERROR";
    const customError = new Error(message);
    (customError as any).code = code;
    (customError as any).status = error.response?.status;
    return Promise.reject(customError);
  }
);
