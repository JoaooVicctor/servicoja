import { useUser } from "@/src/contexts/UserContext";
import { hideConversation } from "@/src/services/chat";
import { db } from "@/src/services/firebase";
import { Conversation } from "@/src/types/Chat";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function ConversationsScreen() {
  const { user } = useUser();

  const [conversations, setConversations] =
    useState<Conversation[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  useEffect(() => {
    if (!user?.id) {
      setConversations([]);
      setIsLoading(false);
      return;
    }

    const conversationsQuery = query(
      collection(db, "conversations"),
      where(
        "participantIds",
        "array-contains",
        user.id
      )
    );

    const unsubscribe = onSnapshot(
      conversationsQuery,
      (snapshot) => {
       const loadedConversations =
  snapshot.docs.map((document) => ({
    id: document.id,
    ...(document.data() as Omit<
      Conversation,
      "id"
    >),
  }));

const visibleConversations =
  loadedConversations.filter(
    (conversation) =>
      !conversation.hiddenFor?.includes(
        user.id
      )
  );

visibleConversations.sort((a, b) => {
  const timeA =
    a.lastMessageAt?.toMillis?.() ?? 0;

  const timeB =
    b.lastMessageAt?.toMillis?.() ?? 0;

  return timeB - timeA;
});

setConversations(
  visibleConversations
);

setIsLoading(false);

        

        setIsLoading(false);
      },
      (error) => {
        console.log(
          "Erro ao carregar conversas:",
          error
        );

        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [user?.id]);

  function openConversation(
    conversationId: string
  ) {
    router.push({
      pathname: "/chat/[id]",
      params: {
        id: conversationId,
      },
    });
  }

  async function deleteConversation(
  conversationId: string
) {
  if (!user?.id) return;

  Alert.alert(
    "Apagar conversa",
    "Deseja remover esta conversa da sua lista?",
    [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Apagar",
        style: "destructive",
        onPress: async () => {
          await hideConversation(
            conversationId,
            user.id
          );
        },
      },
    ]
  );
}

  function getOtherPersonName(
    conversation: Conversation
  ) {
    if (!user) {
      return "";
    }

    if (
      conversation.customerId === user.id
    ) {
      return conversation.ownerName;
    }

    return conversation.customerName;
  }

  function formatConversationTime(
    conversation: Conversation
  ) {
    const date =
      conversation.lastMessageAt
        ?.toDate?.();

    if (!date) {
      return "";
    }

    const today = new Date();

    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() ===
        today.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString(
        "pt-BR",
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      );
    }

    return date.toLocaleDateString(
      "pt-BR",
      {
        day: "2-digit",
        month: "2-digit",
      }
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#1677FF"
        />

        <Text style={styles.loadingText}>
          Carregando conversas...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Conversas
        </Text>

        <Text style={styles.headerDescription}>
          Suas mensagens sobre serviços
        </Text>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          conversations.length === 0 &&
            styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="chatbubbles-outline"
                size={54}
                color="#1677FF"
              />
            </View>

            <Text style={styles.emptyTitle}>
              Nenhuma conversa
            </Text>

            <Text
              style={styles.emptyDescription}
            >
              Quando você conversar com um
              anunciante, a conversa aparecerá
              aqui.
            </Text>

            <Pressable
              style={styles.exploreButton}
              onPress={() =>
                router.push("/(tabs)")
              }
            >
              <Ionicons
                name="search-outline"
                size={19}
                color="#FFFFFF"
              />

              <Text
                style={styles.exploreButtonText}
              >
                Explorar serviços
              </Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => {
          console.log("ITEM MOBILE:", JSON.stringify(item)); // ADICIONE ESSA LINHA
          const otherPersonName =
            getOtherPersonName(item);

          return (
            <Pressable
              style={styles.conversationCard}
              onPress={() =>
                openConversation(item.id)
              }
              onLongPress={() =>
                deleteConversation(item.id)
              }
              delayLongPress={300}
            >
              {item.serviceImage ? (
                <Image
                  source={{
                    uri: item.serviceImage,
                  }}
                  style={styles.serviceImage}
                />
              ) : (
                <View
                  style={
                    styles.imagePlaceholder
                  }
                >
                  <Ionicons
                    name="briefcase-outline"
                    size={26}
                    color="#1677FF"
                  />
                </View>
              )}

              <View
                style={
                  styles.conversationInformation
                }
              >
                <View style={styles.topRow}>
                  <Text
                    style={styles.personName}
                    numberOfLines={1}
                  >
                    {otherPersonName}
                  </Text>

                  <Text
                    style={
                      styles.conversationTime
                    }
                  >
                    {formatConversationTime(
                      item
                    )}
                  </Text>
                </View>

                <Text
                  style={styles.serviceTitle}
                  numberOfLines={1}
                >
                  {item.serviceTitle}
                </Text>

                <Text
                  style={styles.lastMessage}
                  numberOfLines={1}
                >
                  {item.lastMessage ||
                    "Conversa iniciada"}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color="#B0B0B0"
              />
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6F8",
  },

  header: {
    paddingTop:
      Platform.OS === "web" ? 25 : 56,
    paddingHorizontal: 20,
    paddingBottom: 18,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EAEAEA",
  },

  headerTitle: {
    fontSize: 27,
    fontWeight: "900",
    color: "#202020",
  },

  headerDescription: {
    fontSize: 14,
    color: "#777777",
    marginTop: 4,
  },

  listContent: {
    paddingHorizontal: 15,
    paddingTop: 14,
    paddingBottom: 100,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  conversationCard: {
    minHeight: 92,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 11,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  serviceImage: {
    width: 66,
    height: 66,
    borderRadius: 13,
    backgroundColor: "#E8E8E8",
  },

  imagePlaceholder: {
    width: 66,
    height: 66,
    borderRadius: 13,
    backgroundColor: "#EAF3FF",
    alignItems: "center",
    justifyContent: "center",
  },

  conversationInformation: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  personName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: "#242424",
    marginRight: 8,
  },

  conversationTime: {
    fontSize: 12,
    color: "#888888",
  },

  serviceTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1677FF",
    marginTop: 5,
  },

  lastMessage: {
    fontSize: 14,
    color: "#707070",
    marginTop: 5,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    fontSize: 14,
    color: "#777777",
    marginTop: 12,
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingBottom: 70,
  },

  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#EAF3FF",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#292929",
    marginTop: 20,
  },

  emptyDescription: {
    fontSize: 15,
    color: "#777777",
    textAlign: "center",
    lineHeight: 22,
    marginTop: 8,
  },

  exploreButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#1677FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 22,
    marginTop: 24,
  },

  exploreButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});