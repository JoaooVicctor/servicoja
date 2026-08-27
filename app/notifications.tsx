import { useUser } from "@/src/contexts/UserContext";
import { db } from "@/src/services/firebase";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import {
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

import {
  useCallback,
  useState,
} from "react";

import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";

export default function NotificationsScreen() {
  const { user, setUser } = useUser();

  const [notificationsEnabled, setNotificationsEnabled] =
    useState(true);

  const [loading, setLoading] = useState(false);

  const [initialLoading, setInitialLoading] =
    useState(true);

  async function loadNotificationSettings() {
    if (!user?.id) {
      setInitialLoading(false);
      return;
    }

    try {
      setInitialLoading(true);

      const userSnapshot = await getDoc(
        doc(db, "users", user.id)
      );

      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();

        const enabled =
          userData.notificationsEnabled !== false;

        setNotificationsEnabled(enabled);
      }
    } catch (error) {
      console.log(
        "Erro ao carregar configurações de notificações:",
        error
      );
    } finally {
      setInitialLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadNotificationSettings();
    }, [user?.id])
  );

  async function handleToggle(value: boolean) {
    if (!user?.id) return;

    try {
      setLoading(true);

      await updateDoc(
        doc(db, "users", user.id),
        {
          notificationsEnabled: value,
        }
      );

      setNotificationsEnabled(value);

      await setUser({
        ...user,
        notificationsEnabled: value,
      });
    } catch (error) {
      console.log(
        "Erro ao atualizar notificações:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={25}
            color="#222"
          />
        </TouchableOpacity>

        <Text style={styles.title}>
          Notificações
        </Text>

        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="notifications-outline"
              size={25}
              color="#1677FF"
            />
          </View>

          <View style={styles.info}>
            <Text style={styles.itemTitle}>
              Receber notificações
            </Text>

            <Text style={styles.description}>
              Receba notificações de novas mensagens
              e atividades importantes.
            </Text>
          </View>

          {loading || initialLoading ? (
            <ActivityIndicator
              size="small"
              color="#1677FF"
            />
          ) : (
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggle}
              trackColor={{
                false: "#D1D1D1",
                true: "#8FC1FF",
              }}
              thumbColor={
                notificationsEnabled
                  ? "#1677FF"
                  : "#F4F4F4"
              }
            />
          )}
        </View>

        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color="#777"
          />

          <Text style={styles.infoText}>
            Você pode alterar essa configuração a
            qualquer momento.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6FA",
  },

  header: {
    height: 64,
    marginTop: 30,
    backgroundColor: "#FFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  placeholder: {
    width: 40,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
  },

  content: {
    padding: 20,
  },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
  },

  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EAF3FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  info: {
    flex: 1,
    marginRight: 10,
  },

  itemTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
    marginBottom: 5,
  },

  description: {
    fontSize: 13,
    lineHeight: 19,
    color: "#777",
  },

  infoBox: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },

  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: "#777",
    marginLeft: 8,
  },
});