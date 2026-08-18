import { useUser } from "@/src/contexts/UserContext";
import { hideConversation } from "@/src/services/chat";
import { db } from "@/src/services/firebase";
import { Conversation } from "@/src/types/Chat";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";

import {
  collection,
  doc,
  onSnapshot
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
  TextInput,
  View,
} from "react-native";

export default function ConversationsScreen() {
  const { user } = useUser();

  const [conversations, setConversations] =
    useState<Conversation[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

    const [searchText, setSearchText] =
  useState("");

    const [userStatus, setUserStatus] = useState<
  Record<
    string,
    {
      online: boolean;
      photoURL: string | null;
    }
  >
>({});

 useEffect(() => {
  if (!user?.id) {
    setConversations([]);
    setIsLoading(false);
    return;
  }

  const currentUserId = String(user.id);

  const unsubscribe = onSnapshot(
    collection(db, "conversations"),
    (snapshot) => {
      const loadedConversations =
        snapshot.docs.map((document) => ({
          id: document.id,
          ...(document.data() as Omit<
            Conversation,
            "id"
          >),
        }));

      const myConversations =
        loadedConversations.filter((conversation) => {
          const participantIds = Array.isArray(
            conversation.participantIds
          )
            ? conversation.participantIds
            : [];

          return (
            participantIds.includes(currentUserId) ||
            conversation.customerId === currentUserId ||
            conversation.ownerId === currentUserId
          );
        });

      const visibleConversations =
        myConversations.filter((conversation) => {
          const isHidden =
            conversation.hiddenFor?.includes(
              currentUserId
            );

          const unreadCount =
            conversation.unreadCounts?.[
              currentUserId
            ] ?? 0;

          return !isHidden || unreadCount > 0;
        });

      visibleConversations.sort((a, b) => {
        const timeA =
          a.lastMessageAt?.toMillis?.() ?? 0;

        const timeB =
          b.lastMessageAt?.toMillis?.() ?? 0;

        return timeB - timeA;
      });

      setConversations(visibleConversations);
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

  useEffect(() => {
  if (!user?.id || conversations.length === 0) {
    return;
  }

  const otherUserIds = Array.from(
    new Set(
      conversations
        .map((conversation) =>
          getOtherPersonId(conversation)
        )
        .filter(Boolean)
    )
  );

  const unsubscribes = otherUserIds.map(
    (otherUserId) =>
      onSnapshot(
        doc(db, "users", otherUserId),
        (snapshot) => {
          const data = snapshot.data();

          setUserStatus((prev) => ({
            ...prev,
            [otherUserId]: {
              online: data?.online === true,
              photoURL: data?.photoURL ?? null,
            },
          }));
        }
      )
  );

  return () => {
    unsubscribes.forEach((unsubscribe) =>
      unsubscribe()
    );
  };
}, [user?.id, conversations]);

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

function getOtherPersonId(
  conversation: Conversation
) {
  if (!user) {
    return "";
  }

  if (conversation.customerId === user.id) {
    return conversation.ownerId;
  }

  return conversation.customerId;
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

  function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

const filteredConversations =
  conversations.filter((conversation) => {
    const search = normalizeSearchText(searchText);

    if (!search) {
      return true;
    }

    const personName = normalizeSearchText(
      getOtherPersonName(conversation)
    );

    const serviceTitle = normalizeSearchText(
      conversation.serviceTitle ?? ""
    );

    return (
      personName.includes(search) ||
      serviceTitle.includes(search)
    );
  });

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
    <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Conversas
        </Text>

        <Text style={styles.headerDescription}>
          Suas mensagens sobre serviços
        </Text>

        <View style={styles.searchContainer}>
  <Ionicons
    name="search-outline"
    size={20}
    color="#8A8A8A"
  />

  <TextInput
    style={styles.searchInput}
    placeholder="Pesquisar conversa ou anúncio"
    placeholderTextColor="#9A9A9A"
    value={searchText}
    onChangeText={setSearchText}
  />

  {searchText.length > 0 && (
    <Pressable
      onPress={() => setSearchText("")}
      hitSlop={10}
    >
      <Ionicons
        name="close-circle"
        size={20}
        color="#A0A0A0"
      />
    </Pressable>
  )}
</View>
      </View>

      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          filteredConversations.length === 0 &&
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
              {searchText.trim()
                ? "Nenhuma conversa encontrada"
                : "Nenhuma conversa"}
            </Text>

            <Text
              style={styles.emptyDescription}
            >
             {searchText.trim()
                ? "Tente pesquisar por outro nome ou anúncio."
                : "Quando você conversar com um anunciante, a conversa aparecerá aqui."}
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
    
          const otherPersonName =
            getOtherPersonName(item);

            const otherPersonId =
            getOtherPersonId(item);

          const otherUserStatus =
            userStatus[otherPersonId];

          const avatarPhoto = item.serviceImage;

          const unreadCount =
            item.unreadCounts?.[user?.id ?? ""] ?? 0;

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
              <View style={styles.avatarWrapper}>
  {avatarPhoto ? (
    <Image
      source={{
        uri: avatarPhoto,
      }}
      style={styles.serviceImage}
    />
  ) : (
    <View style={styles.imagePlaceholder}>
      <Ionicons
  name="briefcase-outline"
  size={31}
  color="#1677FF"
/>
    </View>
  )}

  <View
    style={[
      styles.onlineDot,
      {
        backgroundColor:
          otherUserStatus?.online === true
            ? "#20D45A"
            : "#B8B8B8",
      },
    ]}
  />
</View>

              <View
                style={
                  styles.conversationInformation
                }
              >
               <View style={styles.topRow}>
                  <Text
                    style={[
                      styles.personName,
                      unreadCount > 0 && styles.personNameUnread,
                    ]}
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

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={[
                      styles.lastMessage,
                      unreadCount > 0 && styles.lastMessageUnread,
                    ]}
                    numberOfLines={1}
                  >
                    {item.lastMessage ||
                      "Conversa iniciada"}
                  </Text>

                  {unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
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
    Platform.OS === "web" ? 25 : 58,
  paddingHorizontal: 24,
  paddingBottom: 22,
  backgroundColor: "#F5F6F8",
},

  headerTitle: {
  fontSize: 35,
  fontWeight: "900",
  color: "#0F172A",
},

  headerDescription: {
    fontSize: 14,
    color: "#777777",
    marginTop: 4,
  },

 listContent: {
  paddingHorizontal: 22,
  paddingTop: 10,
  paddingBottom: 120,
},

  emptyListContent: {
    flexGrow: 1,
  },

  conversationCard: {
  minHeight: 112,
  backgroundColor: "#FFFFFF",
  borderRadius: 24,
  marginBottom: 16,
  padding: 16,
  flexDirection: "row",
  alignItems: "center",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.05,
  shadowRadius: 14,
  elevation: 3,
},

  serviceImage: {
  width: 70,
  height: 70,
  borderRadius: 35,
  backgroundColor: "#E8E8E8",
},

  imagePlaceholder: {
  width: 70,
  height: 70,
  borderRadius: 35,
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
  avatarWrapper: {
  width: 74,
  height: 74,
  position: "relative",
  alignItems: "center",
  justifyContent: "center",
},

onlineDot: {
  position: "absolute",
  right: 3,
  bottom: 5,
  width: 17,
  height: 17,
  borderRadius: 9,
  borderWidth: 3,
  borderColor: "#FFFFFF",
},
searchContainer: {
  height: 50,
  backgroundColor: "#FFFFFF",
  borderRadius: 25,
  marginTop: 18,
  paddingHorizontal: 16,
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.04,
  shadowRadius: 10,
  elevation: 2,
},

searchInput: {
  flex: 1,
  fontSize: 15,
  color: "#202020",
  paddingVertical: 0,
},

personNameUnread: {
  color: "#0F172A",
  fontWeight: "900",
},

lastMessageUnread: {
  color: "#202020",
  fontWeight: "700",
},

unreadBadge: {
  minWidth: 22,
  height: 22,
  borderRadius: 11,
  backgroundColor: "#20D45A",
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: 6,
  marginLeft: 8,
},

unreadBadgeText: {
  color: "#FFFFFF",
  fontSize: 11,
  fontWeight: "800",
},
});