import axios from "axios";
import { Storage } from "../utils/storage";

// Production Render Live Cloud API
export const API_BASE_URL = "https://padosipro-take-home.onrender.com/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
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

// Response error handler
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      "Unable to connect to the server. Please check your internet connection.";
    const code = error.response?.data?.error?.code || "NETWORK_ERROR";
    const customError = new Error(message);
    (customError as any).code = code;
    (customError as any).status = error.response?.status;
    return Promise.reject(customError);
  }
);
