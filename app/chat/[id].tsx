import { useUser } from "@/src/contexts/UserContext";
import { sendMessage } from "@/src/services/chat";
import { uploadImage } from "@/src/services/cloudinary";
import { db } from "@/src/services/firebase";
import { ChatMessage } from "@/src/types/Chat";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import {
  collection,
  onSnapshot,
  orderBy,
  query,
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

  useEffect(() => {
    if (!id) {
      return;
    }

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
      (snapshot) => {
        const loadedMessages =
          snapshot.docs.map((document) => ({
            id: document.id,
            ...(document.data() as Omit<
              ChatMessage,
              "id"
            >),
          }));

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
  }, [id]);

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

  async function handleSendMessage() {
  if (!user || !id || isSending) {
    return;
  }

  if (!text.trim() && !selectedImage) {
    return;
  }

  try {
    setIsSending(true);

    // CASO TENHA FOTO
    if (selectedImage) {
      const imageUrl =
        await uploadImage(selectedImage);

      await sendMessage({
        conversationId: id,
        senderId: user.id,
        senderName: user.name,
        type: "image",
        imageUrl,
        text: text.trim(),
      });

      setSelectedImage(null);
      setText("");
    }

  
    else {
      await sendMessage(
        id,
        user.id,
        user.name,
        text.trim()
      );

      setText("");
    }
  } catch (error) {
    Alert.alert(
      "Erro",
      "Não foi possível enviar."
    );

    console.log(error);
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
  if (!user) return;

  if (item.senderId !== user.id) {
    return;
  }

  const created =
    item.createdAt?.toMillis?.() ?? 0;

  const umaHora = 60 * 60 * 1000;

  const podeApagar =
    Date.now() - created <= umaHora;

  if (!podeApagar) {
    Alert.alert(
      "Tempo expirado",
      "Você só pode apagar uma mensagem até 1 hora após o envio."
    );
    return;
  }

  Alert.alert(
    "Mensagem",
    "O que deseja fazer?",
    [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Apagar para todos",
        style: "destructive",
        onPress: () => {
          console.log(item.id);
        },
      },
    ]
  );
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

        <View>
          <Text style={styles.headerTitle}>
            Conversa
          </Text>

          <Text style={styles.headerSubtitle}>
            ServiçoJá
          </Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
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

          return (
            <View
              style={[
                styles.messageRow,
                isMine
                  ? styles.myMessageRow
                  : styles.otherMessageRow,
              ]}
            >
              <Pressable
                onLongPress={() => handleLongPress(item)}
                style={{
                  maxWidth: "80%",
                  alignSelf: isMine ? "flex-end" : "flex-start",
                }}
              >
                <View
                  style={[
                    styles.messageBubble,
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

                  {(!item.type ||
                    item.type === "text") && (
                    <Text
                      style={[
                        styles.messageText,
                        isMine &&
                          styles.myMessageText,
                      ]}
                    >
                      {item.text}
                    </Text>
                  )}

                  {item.type === "image" &&
                    item.imageUrl && (
                      <Pressable
                        onPress={() => {
                          setPreviewImage(item.imageUrl!);
                          setPreviewVisible(true);
                        }}
                      >
                        <Image
                          source={{ uri: item.imageUrl }}
                          style={styles.chatImage}
                          resizeMode="cover"
                        />
                      </Pressable>
                    )}

                  {item.type === "image" &&
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

                  {item.type === "audio" && (
                    <View style={styles.audioBubble}>
                      <Ionicons
                        name="mic"
                        size={20}
                        color={
                          isMine
                            ? "#FFFFFF"
                            : "#1677FF"
                        }
                      />

                      <Text
                        style={[
                          styles.audioText,
                          isMine &&
                            styles.myAudioText,
                        ]}
                      >
                        Áudio
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
  visible={previewVisible}
  transparent
  animationType="fade"
>
  <View
    style={{
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.95)",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <Pressable
      style={{
        position: "absolute",
        top: 50,
        right: 20,
        zIndex: 10,
      }}
      onPress={() => setPreviewVisible(false)}
    >
      <Ionicons
        name="close"
        size={34}
        color="#FFFFFF"
      />
    </Pressable>

    <Image
      source={{ uri: previewImage }}
      style={{
        width: "100%",
        height: "80%",
      }}
      resizeMode="contain"
    />
  </View>
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
  gap: 8,
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