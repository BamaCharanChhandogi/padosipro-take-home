import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { Colors } from "../theme";

import { WelcomeScreen } from "../screens/WelcomeScreen";
import { OtpVerificationScreen } from "../screens/OtpVerificationScreen";
import { ProfileSetupScreen } from "../screens/ProfileSetupScreen";
import { TaskSelectionScreen } from "../screens/TaskSelectionScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { AccountScreen } from "../screens/AccountScreen";

const Stack = createNativeStackNavigator();

export const RootNavigator: React.FC = () => {
  const { user, token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.screenBg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={Colors.primaryGreen} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "fade",
          contentStyle: { backgroundColor: Colors.screenBg },
        }}
      >
        {!token ? (
          // Auth Stack
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
          </>
        ) : !user?.hasCompletedProfile ? (
          // First-login Profile Gate
          <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        ) : (
          // Authenticated Main App Stack
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="TaskSelection" component={TaskSelectionScreen} />
            <Stack.Screen name="Account" component={AccountScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
