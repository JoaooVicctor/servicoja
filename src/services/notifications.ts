import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import {
  arrayUnion,
  doc,
  serverTimestamp,
  updateDoc,
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

  const tokenResult =
    await Notifications.getExpoPushTokenAsync({
      projectId,
    });

  const token = tokenResult.data;

  await updateDoc(doc(db, "users", userId), {
    expoPushTokens: arrayUnion(token),
    pushTokenUpdatedAt: serverTimestamp(),
  });

  return token;
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