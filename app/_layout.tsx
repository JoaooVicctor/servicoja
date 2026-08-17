import { FavoritesProvider } from "@/src/contexts/FavoritesContext";
import { LocationPickerProvider } from "@/src/contexts/LocationPickerContext";
import { ServiceProvider } from "@/src/contexts/ServiceContext";
import { UserProvider, useUser } from "@/src/contexts/UserContext";
import { registerForPushNotifications } from "@/src/services/notifications";
import * as Notifications from "expo-notifications";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import Toast from "react-native-toast-message";

import {
  setUserOffline,
  setUserOnline,
  updatePendingMessages,
} from "@/src/services/presence";

import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useEffect } from "react";
import { AppState } from "react-native";

function AppContent() {
  const { user } = useUser();

  useEffect(() => {
  if (!user?.id) {
    return;
  }

  registerForPushNotifications(user.id).catch(
    (error) => {
      console.log(
        "Erro ao registrar push token:",
        error
      );
    }
  );
}, [user?.id]);

useEffect(() => {
  const subscription =
    Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const conversationId =
          response.notification.request.content
            .data?.conversationId;

        if (
          typeof conversationId === "string" &&
          conversationId.length > 0
        ) {
          router.push({
            pathname: "/chat/[id]",
            params: {
              id: conversationId,
            },
          });
        }
      }
    );

  return () => {
    subscription.remove();
  };
}, []);

  useEffect(() => {
  if (!user?.id) return;

  async function initializePresence() {
    if (!user) return;

    await setUserOnline(user.id);
    await updatePendingMessages(user.id);
  }

  initializePresence();

  const subscription = AppState.addEventListener(
    "change",
    async (state) => {
      if (!user) return;

      if (state === "active") {
        await setUserOnline(user.id);
        await updatePendingMessages(user.id);
      } else {
        await setUserOffline(user.id);
      }
    }
  );

  return () => {
    if (user) {
      setUserOffline(user.id);
    }

    subscription.remove();
  };
}, [user]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="chat/[id]" />
      </Stack>

      <StatusBar style="auto" />
      <Toast />
    </>
  );
}

export default function RootLayout() {
  return (
   <GestureHandlerRootView style={{ flex: 1 }}>
  <KeyboardProvider>
    <LocationPickerProvider>
      <UserProvider>
        <ServiceProvider>
          <FavoritesProvider>
            <AppContent />
          </FavoritesProvider>
        </ServiceProvider>
      </UserProvider>
    </LocationPickerProvider>
  </KeyboardProvider>
</GestureHandlerRootView>
  );
}