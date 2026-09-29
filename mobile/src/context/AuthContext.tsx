import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Profile } from "../types";
import { apiClient } from "../api/client";
import { Storage } from "../utils/storage";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  loginWithToken: (token: string, user: User) => Promise<void>;
  updateUserProfile: (profile: Profile) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const TOKEN_KEY = "@padosipro_jwt_token";
const USER_KEY = "@padosipro_user_data";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session on app launch
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const storedToken = await Storage.getItem(TOKEN_KEY);
        const storedUser = await Storage.getItem(USER_KEY);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Verify with server in background
          try {
            const res = await apiClient.get("/auth/me");
            if (res.data?.data) {
              setUser(res.data.data);
              await Storage.setItem(USER_KEY, JSON.stringify(res.data.data));
            }
          } catch (err: any) {
            // If token expired, logout
            if (err?.code === "TOKEN_EXPIRED" || err?.status === 401) {
              await logout();
            }
          }
        }
      } catch (e) {
        console.warn("Failed to restore auth session:", e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const loginWithToken = async (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    await Storage.setItem(TOKEN_KEY, newToken);
    await Storage.setItem(USER_KEY, JSON.stringify(newUser));
  };

  const updateUserProfile = (newProfile: Profile) => {
    if (user) {
      const updatedUser = {
        ...user,
        hasCompletedProfile: true,
        profile: newProfile,
      };
      setUser(updatedUser);
      Storage.setItem(USER_KEY, JSON.stringify(updatedUser));
    }
  };

  const refreshUser = async () => {
    try {
      const res = await apiClient.get("/auth/me");
      if (res.data?.data) {
        setUser(res.data.data);
        await Storage.setItem(USER_KEY, JSON.stringify(res.data.data));
      }
    } catch (err) {
      console.warn("Could not refresh user info", err);
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    await Storage.removeItem(TOKEN_KEY);
    await Storage.removeItem(USER_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        loginWithToken,
        updateUserProfile,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
