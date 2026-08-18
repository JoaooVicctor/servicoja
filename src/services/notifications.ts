import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { Platform } from "react-native";

import {
  arrayUnion,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "./firebase";

Notifications.setNotificationHandler({
  handleNotification: async () =>
    ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    } as any),
});

export async function registerForPushNotifications(
  userId: string
) {
  try {
    if (!Device.isDevice) {
      console.log(
        "Notificação push só funciona em celular físico."
      );
      return null;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(
        "default",
        {
          name: "default",
          importance:
            Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#1677FF",
          sound: "default",
        }
      );
    }

    const currentPermission =
      await Notifications.getPermissionsAsync();

    let finalStatus = currentPermission.status;

    if (finalStatus !== "granted") {
      const requestedPermission =
        await Notifications.requestPermissionsAsync();

      finalStatus = requestedPermission.status;
    }

    if (finalStatus !== "granted") {
      console.log(
        "Permissão de notificação negada."
      );
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas
        ?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.log(
        "ProjectId do EAS não encontrado."
      );
      return null;
    }

    const tokenResult =
      await Notifications.getExpoPushTokenAsync({
        projectId,
      });

    const token = tokenResult.data;

    await setDoc(
      doc(db, "users", userId),
      {
        expoPushTokens: arrayUnion(token),
        pushTokenUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return token;
  } catch (error) {
    console.log(
      "Erro ao registrar notificação:",
      error
    );

    return null;
  }
}

export async function sendPushNotifications({
  tokens,
  title,
  body,
  data,
}: {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}) {
  const validTokens = tokens.filter((token) =>
    token.startsWith("ExponentPushToken")
  );

  if (validTokens.length === 0) {
    return;
  }

  await fetch(
    "https://exp.host/--/api/v2/push/send",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        validTokens.map((token) => ({
          to: token,
          sound: "default",
          title,
          body,
          data,
          priority: "high",
          channelId: "default",
        }))
      ),
    }
  );
}

export function listenNotificationResponses() {
  const subscription =
    Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const conversationId =
          response.notification.request.content.data
            ?.conversationId;

        if (typeof conversationId === "string") {
          router.push(`/chat/${conversationId}` as any);
        }
      }
    );

  return () => {
    subscription.remove();
  };
}