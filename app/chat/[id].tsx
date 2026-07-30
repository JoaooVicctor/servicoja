import { useUser } from "@/src/contexts/UserContext";
import { uploadAudio } from "@/src/services/audio";
import {
  deleteMessageForEveryone,
  deleteMessageForMe,
  markMessagesAsDelivered,
  sendMessage,
} from "@/src/services/chat";
import { uploadImage } from "@/src/services/cloudinary";
import { db } from "@/src/services/firebase";
import { ChatMessage } from "@/src/types/Chat";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as ImagePicker from "expo-image-picker";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const { user } = useUser();

  const flatListRef =
    useRef<FlatList<ChatMessage>>(null);

    const messageRefs = useRef<
    Record<string, View | null>
    >({});

  const [messages, setMessages] = useState<
    ChatMessage[]
  >([]);

  const [text, setText] = useState("");

  const [isSending, setIsSending] =
    useState(false);

  const [selectedImage, setSelectedImage] =
    useState<string | null>(null);

  const [previewVisible, setPreviewVisible] =
    useState(false);

  const [previewImage, setPreviewImage] =
    useState("");
    const [replyMessage, setReplyMessage] =
    useState<ChatMessage | null>(null);

    const [highlightedMessageId, setHighlightedMessageId] =
    useState<string | null>(null);

    const [selectedMessage, setSelectedMessage] =
    useState<ChatMessage | null>(null);


    const [menuVisible, setMenuVisible] =
  useState(false);

  const [otherUserName, setOtherUserName] =
  useState("Conversa");

const [otherUserOnline, setOtherUserOnline] =
  useState(false);

const [otherUserLastSeen, setOtherUserLastSeen] =
  useState<Timestamp | null>(null);

const [recording, setRecording] =
  useState<Audio.Recording | null>(null);

const [isRecording, setIsRecording] =
  useState(false);

const [sound, setSound] =
  useState<Audio.Sound | null>(null);

const [playingId, setPlayingId] =
  useState<string | null>(null);

const [isPlaying, setIsPlaying] =
  useState(false);

const [position, setPosition] =
  useState(0);

const [duration, setDuration] =
  useState(0);

  const [otherUserPhoto, setOtherUserPhoto] =
  useState<string | null>(null);

 useEffect(() => {
  if (!id || !user?.id) {
    return;
  }

  markMessagesAsDelivered(
    id,
    user.id
  );

  const messagesQuery = query(
    collection(
      db,
      "conversations",
      id,
      "messages"
    ),
    orderBy("createdAt", "asc")
  );

  const unsubscribe = onSnapshot(
  messagesQuery,
  async (snapshot) => {
    await markMessagesAsDelivered(
      id,
      user.id
    );
      const loadedMessages =
        snapshot.docs
          .map((document) => ({
            id: document.id,
            ...(document.data() as Omit<
              ChatMessage,
              "id"
            >),
          }))
          .map((message) => {
  if (
    user?.id &&
    message.hiddenFor?.includes(user.id)
  ) {
    return {
      ...message,
      hiddenForMe: true,
    };
  }

  return message;
})

      setMessages(loadedMessages);
    },
    (error) => {
      console.log(
        "Erro ao carregar mensagens:",
        error
      );

      Alert.alert(
        "Erro",
        "Não foi possível carregar as mensagens."
      );
    }
  );

  return unsubscribe;
}, [id, user?.id]);

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({
        animated: true,
      });
    }, 100);
  }, [messages]);

  useEffect(() => {
  if (!id || !user?.id) {
    return;
  }

  const conversationId = id;
  const currentUserId = user.id;

  let unsubscribeUser: (() => void) | undefined;

  async function loadOtherUser() {
    const conversationRef = doc(
      db,
      "conversations",
      conversationId
    );

    const conversationSnap =
      await getDoc(conversationRef);

    if (!conversationSnap.exists()) {
      return;
    }

    const data = conversationSnap.data();

    const otherUserId =
      data.customerId === currentUserId
        ? data.ownerId
        : data.customerId;

    const name =
      data.customerId === currentUserId
        ? data.ownerName
        : data.customerName;

    setOtherUserName(name ?? "Usuário");

    unsubscribeUser = onSnapshot(
      doc(db, "users", otherUserId),
      (snapshot) => {
        if (!snapshot.exists()) {
          setOtherUserOnline(false);
          setOtherUserLastSeen(null);
          return;
        }

        const userData = snapshot.data();

        setOtherUserOnline(
          userData.online === true
        );

        setOtherUserLastSeen(
          userData.lastSeen ?? null
        );

        setOtherUserPhoto(
          userData.photoURL ?? null
        );
      },
      (error) => {
        console.log(
          "Erro ao acompanhar usuário:",
          error
        );
      }
    );
  }

  loadOtherUser();

  return () => {
    unsubscribeUser?.();
  };
}, [id, user?.id]);

  async function handleSendMessage() {
  console.log({
    text,
    selectedImage,
    isSending,
    replyMessage,
  });

  if (!user || !id || isSending) {
    return;
  }

  if (!text.trim() && !selectedImage) {
    return;
  }

  try {
    setIsSending(true);

    const replyData = replyMessage
  ? {
      id: replyMessage.id,
      senderId: replyMessage.senderId,
      senderName: replyMessage.senderName,
      type: replyMessage.type,
      ...(replyMessage.text
        ? { text: replyMessage.text }
        : {}),
      ...(replyMessage.imageUrl
        ? { imageUrl: replyMessage.imageUrl }
        : {}),
    }
  : undefined;

    if (selectedImage) {
      const imageUrl = await uploadImage(selectedImage);

      await sendMessage({
        conversationId: id,
        senderId: user.id,
        senderName: user.name,
        type: "image",
        imageUrl,
        text: text.trim(),
        replyTo: replyData,
      });

      setSelectedImage(null);
      setText("");
      setReplyMessage(null);
    } else {
      await sendMessage({
        conversationId: id,
        senderId: user.id,
        senderName: user.name,
        type: "text",
        text: text.trim(),
        replyTo: replyData,
      });

      setText("");
      setReplyMessage(null);
    }
    } catch (error) {
  console.log("ERRO AO ENVIAR:", error);

  Alert.alert(
    "Erro",
    String(error)
  );
} finally {
  setIsSending(false);
}
}

  async function handleSendImage() {
  if (isSending) return;

  try {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permissão necessária",
        "Permita o acesso à galeria."
      );
      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.8,
      });

    if (result.canceled) return;

    const image = result.assets[0];

    if (!image?.uri) return;

    
    setSelectedImage(image.uri);

  } catch (error) {
    Alert.alert(
      "Erro",
      "Não foi possível selecionar a imagem."
    );
  }
}

function handleLongPress(item: ChatMessage) {
  setSelectedMessage(item);
  setMenuVisible(true);
}

function scrollToReply(messageId: string) {
  const index = messages.findIndex(
    (message) => message.id === messageId
  );

  if (index === -1) return;

  try {
    flatListRef.current?.scrollToIndex({
      index,
      animated: true,
      viewPosition: 0.5,
    });
  } catch {
    flatListRef.current?.scrollToEnd({
      animated: true,
    });
  }

  setHighlightedMessageId(messageId);

  setTimeout(() => {
    setHighlightedMessageId(null);
  }, 2000);
}

async function startRecording() {
  try {
    const permission =
      await Audio.requestPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permissão necessária",
        "Permita o acesso ao microfone."
      );
      return;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const result =
      await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

    setRecording(result.recording);
    setIsRecording(true);
  } catch (error) {
    console.log(error);

    Alert.alert(
      "Erro",
      "Não foi possível iniciar a gravação."
    );
  }
}

async function stopRecording() {
  if (!recording || !user || !id) {
    return;
  }

  try {
    await recording.stopAndUnloadAsync();

    const uri = recording.getURI();

    if (!uri) {
      return;
    }

    const audioUrl =
      await uploadAudio(uri);

    await sendMessage({
      conversationId: id,
      senderId: user.id,
      senderName: user.name,
      type: "audio",
      audioUrl,
    });

    setRecording(null);
    setIsRecording(false);
  } catch (error) {
    console.log(error);

    Alert.alert(
      "Erro",
      "Não foi possível enviar o áudio."
    );
  }
}

async function playAudio(
  messageId: string,
  audioUrl: string
) {
  try {
    // Se clicar no mesmo áudio que já está tocando, pausa
    if (sound && playingId === messageId) {
      const status = await sound.getStatusAsync();

      if (status.isLoaded) {
  if (status.isPlaying) {
    await sound.pauseAsync();
    setIsPlaying(false);
  } else {
    await sound.playAsync();
    setIsPlaying(true);
  }
}

      return;
    }

    // Se outro áudio estiver tocando
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
    }

    const { sound: newSound } =
      await Audio.Sound.createAsync({
        uri: audioUrl,
      });

    setSound(newSound);
    setPlayingId(messageId);
    setIsPlaying(true);

    await newSound.playAsync();

    newSound.setOnPlaybackStatusUpdate(
    (status) => {
    if (!status.isLoaded) return;

    setPosition(status.positionMillis);
    setDuration(status.durationMillis ?? 0);

    if (status.didJustFinish) {
      setPlayingId(null);
      setIsPlaying(false);
      setPosition(0);
      setDuration(0);

      newSound.unloadAsync();
      setSound(null);
    }
  }
);
  } catch (error) {
    console.log(error);

    Alert.alert(
      "Erro",
      "Não foi possível reproduzir o áudio."
    );
  }
}

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);

  const minutes = Math.floor(totalSeconds / 60);

  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

    return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#202020"
          />
        </Pressable>

        <View
  style={{
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  }}
>
  {otherUserPhoto ? (
  <Image
    source={{ uri: otherUserPhoto }}
    style={{
      width: 44,
      height: 44,
      borderRadius: 22,
      marginRight: 12,
    }}
  />
) : (
  <View
    style={{
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "#E5E5E5",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    }}
  >
    <Ionicons
      name="person"
      size={24}
      color="#666"
    />
  </View>
)}

          <View>
            <Text style={styles.headerTitle}>
              {otherUserName}
            </Text>

            <Text style={styles.headerSubtitle}>
              {otherUserOnline
                ? "🟢 Online"
                : otherUserLastSeen
                ? `Visto por último às ${otherUserLastSeen
                    .toDate()
                    .toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                : "Offline"}
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        onScrollToIndexFailed={(info) => {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: info.index,
            animated: true,
            viewPosition: 0.5,
          });
        }, 500);
      }}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          styles.messagesContent
        }
        onContentSizeChange={() => {
          flatListRef.current?.scrollToEnd({
            animated: true,
          });
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="chatbubbles-outline"
              size={55}
              color="#AAAAAA"
            />

            <Text style={styles.emptyTitle}>
              Inicie a conversa
            </Text>

            <Text style={styles.emptyDescription}>
              Envie uma mensagem sobre o
              serviço anunciado.
            </Text>
          </View>
        }
                renderItem={({ item }) => {
          const isMine = item.senderId === user?.id;
          const statusIcon =
          item.status === "sent"
            ? "checkmark"
            : "checkmark-done";

          return (
              <View
                ref={(ref) => {
                messageRefs.current[item.id] = ref;
              }}
              style={[
                styles.messageRow,
                isMine
                  ? styles.myMessageRow
                  : styles.otherMessageRow,
              ]}
            >
              <Pressable  
                  disabled={item.deleted}
                  onLongPress={() => {
                  if (!item.deleted) {
                    handleLongPress(item);
                  }
                }}
                style={{
                  maxWidth: "80%",
                  alignSelf: isMine ? "flex-end" : "flex-start",
                }}
              >
                <View
                  style={[
                    styles.messageBubble,
                    highlightedMessageId === item.id && {
                      borderWidth: 3,
                      borderColor: "#25D366",
                    },
                    isMine
                      ? styles.myMessageBubble
                      : styles.otherMessageBubble,
                    item.type === "image" &&
                      styles.imageMessageBubble,
                  ]}
                >
                  {!isMine && (
                    <Text style={styles.senderName}>
                      {item.senderName}
                    </Text>
                  )}

                  {!item.deleted &&
                  item.replyTo && (
                    <Pressable
                      onPress={() => {
                        if (item.replyTo) {
                          scrollToReply(item.replyTo.id);
                        }
                      }}
                      style={{
                        borderLeftWidth: 3,
                        borderLeftColor: "#1677FF",
                        backgroundColor: isMine
                          ? "rgba(255,255,255,0.18)"
                          : "#F2F2F2",
                        borderRadius: 8,
                        padding: 8,
                        marginBottom: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: "700",
                          color: isMine ? "#FFFFFF" : "#1677FF",
                          marginBottom: 6,
                        }}
                      >
                        {item.replyTo.senderName}
                      </Text>

                      {item.replyTo.type === "image" &&
                      item.replyTo.imageUrl ? (
                        <Image
                          source={{ uri: item.replyTo.imageUrl }}
                          style={{
                            width: 55,
                            height: 55,
                            borderRadius: 8,
                            marginBottom: item.replyTo.text ? 6 : 0,
                          }}
                        />
                      ) : null}

                      {item.replyTo.text ? (
                        <Text
                          numberOfLines={1}
                          style={{
                            color: isMine ? "#FFFFFF" : "#555",
                          }}
                        >
                          {item.replyTo.text}
                        </Text>
                      ) : null}
                    </Pressable>
                  )}

                  {item.hiddenForMe ? (
  <Text
    style={{
      fontStyle: "italic",
      color: isMine ? "#E5E5E5" : "#777",
    }}
  >
    🚫 Esta mensagem foi apagada para você
  </Text>
) : item.deleted ? (
  <Text
    style={{
      fontStyle: "italic",
      color: isMine ? "#E5E5E5" : "#777",
    }}
  >
    🚫 Esta mensagem foi apagada
  </Text>
) : (
  (!item.type || item.type === "text") && (
    <View
  style={{
    flexDirection: "row",
    alignItems: "flex-end",
  }}
>
  <Text
    style={[
      styles.messageText,
      isMine && styles.myMessageText,
    ]}
  >
    {item.text}
  </Text>

  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      marginLeft: 6,
      marginBottom: 1,
      alignSelf: "flex-end",
    }}
  >
        <Text style={{ fontSize: 11, color: isMine ? "#EAEAEA" : "#888", marginRight: 4 }}>
          {item.createdAt?.toDate
            ? item.createdAt.toDate().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
            : ""}
        </Text>

        {isMine && (
          <Ionicons name={statusIcon} size={16} color={item.status === "read" ? "#4FC3F7" : "#FFFFFF"} />
        )}
      </View>
    </View>
  )
)}

                  {!item.deleted &&
                  item.type === "image" &&
                  item.imageUrl && (
                      <Pressable
                        onPress={() => {
                          setPreviewImage(item.imageUrl!);
                          setPreviewVisible(true);
                        }}
                        onLongPress={() => handleLongPress(item)}
                        delayLongPress={300}
                      >
                        <Image
                          source={{ uri: item.imageUrl }}
                          style={styles.chatImage}
                          resizeMode="cover"
                        />

                        <View
  style={{
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 6,
    paddingHorizontal: 6,
  }}
>
  <Text
    style={{
      fontSize: 11,
      color: isMine ? "#EAEAEA" : "#888",
      marginRight: 4,
    }}
  >
    {item.createdAt?.toDate
      ? item.createdAt
          .toDate()
          .toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })
      : ""}
  </Text>

  {isMine && (
    <Ionicons
      name={statusIcon}
      size={16}
      color={
        item.status === "read"
          ? "#4FC3F7"
          : "#FFFFFF"
      }
    />
  )}
</View>
                      </Pressable>
                  )}

                  {!item.deleted &&
                  item.type === "image" &&
                  item.text && (
                      <Text
                        style={[
                          styles.imageCaption,
                          isMine &&
                            styles.myMessageText,
                        ]}
                      >
                        {item.text}
                      </Text>
                    )}

                 {!item.deleted &&
item.type === "audio" &&
item.audioUrl && (
  <View style={styles.audioBubble}>

    <Pressable
      onPress={() =>
        playAudio(
          item.id,
          item.audioUrl!
        )
      }
    >
      <Ionicons
        name={
          playingId === item.id &&
          isPlaying
            ? "pause"
            : "play"
        }
        size={22}
        color={
          isMine
            ? "#FFF"
            : "#1677FF"
        }
      />
    </Pressable>

    
      <View
  style={{
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 12,
  }}
>
  {Array.from({ length: 26 }).map((_, index) => (
    <View
      key={index}
      style={{
        width: 3,
        height: 8 + (index % 5) * 4,
        borderRadius: 2,

        backgroundColor:
          playingId === item.id &&
          duration > 0 &&
          index <
            (position / duration) * 26
            ? "#FFFFFF"
            : isMine
            ? "rgba(255,255,255,0.35)"
            : "#BFC7D5",
      }}
    />
  ))}
</View>

    <Text
      style={{
        fontSize: 11,
        color: isMine
          ? "#FFF"
          : "#555",
      }}
    >
      {playingId === item.id
        ? formatTime(position)
        : "0:00"}
    </Text>

  </View>
)}
                    </View>
              </Pressable>
            </View>
          );
        }}
      />

        {selectedImage && (
  <View
    style={{
      paddingHorizontal: 12,
      paddingTop: 10,
      backgroundColor: "#fff",
      borderTopWidth: 1,
      borderTopColor: "#E5E5E5",
    }}
  >
    <Image
      source={{ uri: selectedImage }}
      style={{
        width: 120,
        height: 120,
        borderRadius: 12,
      }}
    />

    <Pressable
      onPress={() => setSelectedImage(null)}
      style={{
        position: "absolute",
        top: 18,
        left: 100,
        backgroundColor: "#000",
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Ionicons
        name="close"
        size={16}
        color="#fff"
      />
    </Pressable>
  </View>
)}

{replyMessage && (
  <View
    style={{
      backgroundColor: "#FFFFFF",
      borderTopWidth: 1,
      borderTopColor: "#E5E5E5",
      paddingHorizontal: 14,
      paddingVertical: 10,
    }}
  >
    <View
      style={{
        borderLeftWidth: 4,
        borderLeftColor: "#1677FF",
        paddingLeft: 10,
      }}
    >
      <Text
        style={{
          color: "#1677FF",
          fontWeight: "700",
        }}
      >
        Respondendo {replyMessage.senderName}
      </Text>

      <Text
        numberOfLines={1}
        style={{
          color: "#555",
          marginTop: 2,
        }}
      >
        {replyMessage.type === "image"
          ? "📷 Foto"
          : replyMessage.text}
      </Text>
    </View>

    <Pressable
      onPress={() =>
        setReplyMessage(null)
      }
      style={{
        position: "absolute",
        right: 12,
        top: 12,
      }}
    >
      <Ionicons
        name="close"
        size={22}
        color="#777"
      />
    </Pressable>
  </View>
)}

            <View style={styles.inputContainer}>
        <Pressable
          style={[
            styles.attachButton,
            isSending &&
              styles.disabledButton,
          ]}
          onPress={handleSendImage}
          disabled={isSending}
        >
          <Ionicons
            name="image"
            size={24}
            color="#1677FF"
          />
        </Pressable>

        <Pressable
  style={[
    styles.attachButton,
    isSending &&
      styles.disabledButton,
  ]}
  onPress={
    isRecording
      ? stopRecording
      : startRecording
  }
  disabled={isSending}
>
  <Ionicons
    name={
      isRecording
        ? "stop-circle"
        : "mic"
    }
    size={24}
    color={
      isRecording
        ? "#FF3B30"
        : "#1677FF"
    }
  />
</Pressable>

        <TextInput
          style={styles.input}
          placeholder="Digite uma mensagem..."
          placeholderTextColor="#929292"
          value={text}
          onChangeText={setText}
          multiline
        />

        <Pressable
          style={[
          styles.sendButton,
          ((!text.trim() && !selectedImage) ||
            isSending) &&
            styles.disabledButton,
        ]}
          onPress={handleSendMessage}
          disabled={
          (!text.trim() && !selectedImage) ||
          isSending
          }
          >
          <Ionicons
            name="send"
            size={21}
            color="#FFFFFF"
          />
        </Pressable>
      </View>
      <Modal
  visible={menuVisible}
  transparent
  animationType="fade"
>
  <Pressable
    style={{
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.25)",
      justifyContent: "flex-end",
    }}
    onPress={() => setMenuVisible(false)}
  >
    <View
      style={{
        backgroundColor: "#FFF",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingVertical: 10,
      }}
    >

      <Pressable
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 16,
          gap: 12,
        }}
        onPress={() => {
          if (selectedMessage) {
            setReplyMessage(selectedMessage);
          }

          setMenuVisible(false);
        }}
      >
        <Ionicons
          name="return-up-back"
          size={22}
          color="#1677FF"
        />

        <Text>Responder</Text>
      </Pressable>

      {selectedMessage &&
  (() => {
    const created =
      selectedMessage.createdAt
        ?.toMillis?.() ?? 0;

    const isMyMessage =
      selectedMessage.senderId ===
      user?.id;

    const isWithinDeleteLimit =
      Date.now() - created <=
      60 * 60 * 1000;

    const canDeleteForEveryone =
    selectedMessage.senderId === user?.id &&
    Date.now() -
    (selectedMessage.createdAt?.toMillis?.() ?? 0) <=
    60 * 60 * 1000 &&
    !selectedMessage.deleted;

    return (
      <>
        {canDeleteForEveryone && (
          <Pressable
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              gap: 12,
            }}
            onPress={async () => {
              if (
                !id ||
                !user?.id ||
                !selectedMessage
              ) {
                return;
              }

              try {
                await deleteMessageForEveryone(
                  id,
                  selectedMessage.id,
                  user.id
                );
              } catch (error) {
                Alert.alert(
                  "Erro",
                  error instanceof Error
                    ? error.message
                    : "Não foi possível apagar a mensagem."
                );
              } finally {
                setMenuVisible(false);
                setSelectedMessage(null);
              }
            }}
          >
            <Ionicons
              name="trash"
              size={22}
              color="red"
            />

            <Text
              style={{
                color: "red",
              }}
            >
              Apagar para todos
            </Text>
          </Pressable>
        )}

        {!selectedMessage.deleted && (
  <Pressable
    style={{
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      gap: 12,
    }}
    onPress={async () => {
      if (
        !id ||
        !user?.id ||
        !selectedMessage
      ) {
        return;
      }

      try {
        await deleteMessageForMe(
          id,
          selectedMessage.id,
          user.id
        );
      } catch (error) {
        Alert.alert(
          "Erro",
          error instanceof Error
            ? error.message
            : "Não foi possível apagar a mensagem."
        );
      } finally {
        setMenuVisible(false);
        setSelectedMessage(null);
      }
    }}
  >
    <Ionicons
      name="trash-outline"
      size={22}
      color="#555"
    />

    <Text
      style={{
        color: "#333",
      }}
    >
      Apagar para mim
    </Text>
  </Pressable>
)}
      </>
    );
  })()}

    </View>
  </Pressable>
</Modal>

  <Modal
  visible={previewVisible}
  transparent
  animationType="fade"
>
  <Pressable
    style={{
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.95)",
      justifyContent: "center",
      alignItems: "center",
    }}
    onPress={() => setPreviewVisible(false)}
  >
    <Image
      source={{ uri: previewImage }}
      style={{
        width: "100%",
        height: "80%",
      }}
      resizeMode="contain"
    />
  </Pressable>
</Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({

  container: {
  flex: 1,
  backgroundColor: "#F5F6F8",
},

header: {
  paddingTop:
    Platform.OS === "web" ? 18 : 50,
  paddingBottom: 14,
  paddingHorizontal: 16,
  backgroundColor: "#FFFFFF",
  borderBottomWidth: 1,
  borderBottomColor: "#EAEAEA",
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
},

backButton: {
  width: 42,
  height: 42,
  borderRadius: 21,
  alignItems: "center",
  justifyContent: "center",
},

headerTitle: {
  fontSize: 18,
  fontWeight: "800",
  color: "#202020",
},

headerSubtitle: {
  fontSize: 12,
  color: "#777777",
  marginTop: 2,
},

messagesContent: {
  flexGrow: 1,
  padding: 16,
},

emptyContainer: {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: 35,
},

emptyTitle: {
  fontSize: 20,
  fontWeight: "800",
  color: "#333333",
  marginTop: 13,
},

emptyDescription: {
  fontSize: 14,
  color: "#777777",
  textAlign: "center",
  marginTop: 6,
  lineHeight: 20,
},

messageRow: {
  marginBottom: 9,
  flexDirection: "row",
},

myMessageRow: {
  justifyContent: "flex-end",
},

otherMessageRow: {
  justifyContent: "flex-start",
},

messageBubble: {
  borderRadius: 16,
  paddingHorizontal: 13,
  paddingVertical: 10,
  alignSelf: "flex-start",
},

imageMessageBubble: {
  padding: 4,
},

myMessageBubble: {
  backgroundColor: "#1677FF",
  borderBottomRightRadius: 4,
},

otherMessageBubble: {
  backgroundColor: "#FFFFFF",
  borderBottomLeftRadius: 4,
},

senderName: {
  fontSize: 12,
  fontWeight: "700",
  color: "#1677FF",
  marginBottom: 4,
},

messageText: {
  fontSize: 15,
  color: "#333333",
  lineHeight: 21,
  flexShrink: 1,
},

myMessageText: {
  color: "#FFFFFF",
},

chatImage: {
  width: 230,
  height: 230,
  borderRadius: 12,
},

imageCaption: {
  marginTop: 8,
  fontSize: 15,
  color: "#333333",
},

audioBubble: {
  flexDirection: "row",
  alignItems: "center",
  width: 260,
  height: 56,
  paddingHorizontal: 14,
  borderRadius: 28,
},

audioText: {
  fontSize: 15,
  color: "#1677FF",
  fontWeight: "600",
},

myAudioText: {
  color: "#FFFFFF",
},

inputContainer: {
  backgroundColor: "#FFFFFF",
  borderTopWidth: 1,
  borderTopColor: "#E5E5E5",
  paddingHorizontal: 12,
  paddingTop: 10,
  paddingBottom:
    Platform.OS === "ios" ? 25 : 12,
  flexDirection: "row",
  alignItems: "flex-end",
  gap: 9,
},

attachButton: {
  width: 42,
  height: 42,
  borderRadius: 21,
  justifyContent: "center",
  alignItems: "center",
},

input: {
  flex: 1,
  minHeight: 46,
  maxHeight: 110,
  borderRadius: 23,
  backgroundColor: "#F0F2F5",
  paddingHorizontal: 16,
  paddingVertical: 12,
  fontSize: 15,
  color: "#222222",
},

sendButton: {
  width: 46,
  height: 46,
  borderRadius: 23,
  backgroundColor: "#1677FF",
  alignItems: "center",
  justifyContent: "center",
},

disabledButton: {
  opacity: 0.5,
},
});