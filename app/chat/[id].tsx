import { AudioPlayerV2 } from "@/src/components/AudioPlayerV2";
import { useUser } from "@/src/contexts/UserContext";
import { uploadAudio } from "@/src/services/audio";
import {
  deleteMessageForEveryone,
  deleteMessageForMe,
  listenTyping,
  markMessagesAsDelivered,
  sendMessage,
  setTyping,
} from "@/src/services/chat";
import { uploadImage } from "@/src/services/cloudinary";
import { uploadDocument } from "@/src/services/document";
import { db } from "@/src/services/firebase";
import { getCurrentLocation } from "@/src/services/location";
import { ChatMessage } from "@/src/types/Chat";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";

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
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

function SwipeableMessage({
  isMine,
  onReply,
  disabled,
  children,
}: {
  isMine: boolean;
  onReply: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const replyIconOpacity = useRef(new Animated.Value(0)).current;
  const hasTriggeredRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (disabled) return false;

        return (
          gestureState.dx < -10 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5
        );
      },
      onPanResponderGrant: () => {
        hasTriggeredRef.current = false;
      },
      onPanResponderMove: (_, gestureState) => {
        const dx = Math.max(gestureState.dx, -80);

        translateX.setValue(dx);

        replyIconOpacity.setValue(
          Math.min(Math.abs(dx) / 55, 1)
        );

        if (dx <= -60 && !hasTriggeredRef.current) {
          hasTriggeredRef.current = true;
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -60) {
          onReply();
        }

        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          speed: 20,
          bounciness: 6,
        }).start();

        Animated.timing(replyIconOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();

        Animated.timing(replyIconOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Animated.View
        style={{
          position: "absolute",
          right: 6,
          opacity: replyIconOpacity,
          transform: [
            {
              scale: replyIconOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [0.6, 1],
              }),
            },
          ],
        }}
      >
        <Ionicons
          name="arrow-undo"
          size={20}
          color="#1677FF"
        />
      </Animated.View>

      <Animated.View
  {...panResponder.panHandlers}
  style={{
    width: "100%",
    flexDirection: "row",
    justifyContent: isMine
      ? "flex-end"
      : "flex-start",
    transform: [{ translateX }],
  }}
>
        {children}
      </Animated.View>
    </View>
  );
}

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

  const otherUserId =
  user?.id === undefined
    ? ""
    : messages.length > 0
    ? messages.find(
        (m) => m.senderId !== user.id
      )?.senderId ?? ""
    : "";

  const [text, setText] = useState("");

  const [isSending, setIsSending] =
    useState(false);

  const [selectedImage, setSelectedImage] =
    useState<string | null>(null);

    const [selectedDocument, setSelectedDocument] =
    useState<{
      uri: string;
      name: string;
      mimeType: string;
      size: number;
    } | null>(null);

    const [selectedLocation, setSelectedLocation] =
    useState<{
      latitude: number;
      longitude: number;
      address: string;
    } | null>(null);

  const [previewVisible, setPreviewVisible] =
    useState(false);

  const [previewImage, setPreviewImage] =
    useState("");
    const [replyMessage, setReplyMessage] =
    useState<ChatMessage | null>(null);

    const [highlightedMessageId, setHighlightedMessageId] =
    useState<string | null>(null);

    const [pendingMessages, setPendingMessages] =
    useState<any[]>([]);

    const highlightAnim = useRef(new Animated.Value(0)).current;

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

const [isOtherUserTyping, setIsOtherUserTyping] =
  useState(false);

const typingTimeoutRef =
  useRef<ReturnType<typeof setTimeout> | null>(null);

const [recordingDuration, setRecordingDuration] = useState(0);
const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
const pulseAnim = useRef(new Animated.Value(1)).current;
const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

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

  const soundRef = useRef<Audio.Sound | null>(null);

const isSeekingRef = useRef(false);

const currentAudioIdRef = useRef<string | null>(null);


const pendingLoadRef = useRef<Promise<Audio.Sound> | null>(null);

const [playbackRate, setPlaybackRate] =
  useState(1);

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
  if (!id || !otherUserId) {
    return;
  }

  const unsubscribe =
    listenTyping(id, (typing) => {
      setIsOtherUserTyping(
        typing[otherUserId] === true
      );
    });

  return unsubscribe;
}, [id, otherUserId]);



useEffect(() => {
  if (!playingId) {
    return;
  }

  const playingMessage = messages.find(
    (message) => message.id === playingId
  );

  const shouldStop =
    !playingMessage ||
    playingMessage.deleted ||
    playingMessage.hiddenForMe;

  if (shouldStop) {
    if (soundRef.current) {
      soundRef.current.stopAsync();
      soundRef.current.unloadAsync();
      soundRef.current = null;
    }

    setSound(null);
    setPlayingId(null);
    setIsPlaying(false);
    setPosition(0);
    setDuration(0);
    currentAudioIdRef.current = null;
  }
}, [messages, playingId]);

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

 if (
  !text.trim() &&
  !selectedImage &&
  !selectedDocument
) {
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

      ...(replyMessage.text && {
        text: replyMessage.text,
      }),

      ...(replyMessage.imageUrl && {
        imageUrl: replyMessage.imageUrl,
      }),

      ...(replyMessage.audioUrl && {
        audioUrl: replyMessage.audioUrl,
      }),

      ...(replyMessage.documentUrl && {
        documentUrl: replyMessage.documentUrl,
      }),

      ...(replyMessage.documentName && {
        documentName: replyMessage.documentName,
      }),

      ...(replyMessage.latitude !== undefined && {
        latitude: replyMessage.latitude,
      }),

      ...(replyMessage.longitude !== undefined && {
        longitude: replyMessage.longitude,
      }),

      ...(replyMessage.locationAddress && {
        locationAddress:
          replyMessage.locationAddress,
      }),
    }
  : undefined;

    if (selectedImage) {
      const localUri = selectedImage;
      const captionText = text.trim();
      const tempId = `pending-${Date.now()}`;

      setPendingMessages((prev) => [
        ...prev,
        {
          id: tempId,
          senderId: user.id,
          senderName: user.name,
          type: "image",
          imageUrl: localUri,
          text: captionText,
          createdAt: { toDate: () => new Date() },
          status: "sent",
          sending: true,
        },
      ]);

      setSelectedImage(null);
      setText("");
      setReplyMessage(null);

      try {
        const imageUrl = await uploadImage(localUri);

        await sendMessage({
          conversationId: id,
          senderId: user.id,
          senderName: user.name,
          type: "image",
          imageUrl,
          text: captionText,
          replyTo: replyData,
        });
      } finally {
        setPendingMessages((prev) =>
          prev.filter((message) => message.id !== tempId)
        );
      }
    }
    else if (selectedDocument) {
  const documentUrl =
    await uploadDocument(
      selectedDocument.uri,
      selectedDocument.name,
      selectedDocument.mimeType
    );

  await sendMessage({
    conversationId: id,
    senderId: user.id,
    senderName: user.name,
    type: "document",
    documentUrl,
    documentName: selectedDocument.name,
    documentSize: selectedDocument.size,
    replyTo: replyData,
  });

  setSelectedDocument(null);
  setText("");
  setReplyMessage(null);
}
    else {
      await sendMessage({
        conversationId: id,
        senderId: user.id,
        senderName: user.name,
        type: "text",
        text: text.trim(),
        replyTo: replyData,
      });

      setText("");
      await setTyping(id, user.id, false);
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

async function handleSendDocument() {
  if (!user || !id || isSending) {
    return;
  }

  try {
    setIsSending(true);

    const result =
      await DocumentPicker.getDocumentAsync({
        multiple: false,
        copyToCacheDirectory: true,
      });

    if (result.canceled) {
      return;
    }

    const file = result.assets[0];

    setSelectedDocument({
    uri: file.uri,
    name: file.name,
    mimeType:
      file.mimeType ??
      "application/octet-stream",
    size: file.size ?? 0,
  });

  } catch (error) {
    console.log(error);

    Alert.alert(
      "Erro",
      "Não foi possível enviar o documento."
    );
  } finally {
    setIsSending(false);
  }
}

async function handleSendLocation() {
  try {
    const location =
      await getCurrentLocation();

    setSelectedLocation({
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address,
    });

  } catch (error) {
    Alert.alert(
      "Localização",
      error instanceof Error
        ? error.message
        : "Não foi possível obter sua localização."
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
  highlightAnim.setValue(0);

  Animated.sequence([
    Animated.timing(highlightAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }),
    Animated.delay(500),
    Animated.timing(highlightAnim, {
      toValue: 0,
      duration: 700,
      useNativeDriver: false,
    }),
  ]).start(() => setHighlightedMessageId(null));
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
    setRecordingDuration(0);

    recordingIntervalRef.current = setInterval(() => {
      setRecordingDuration((prev) => prev + 1);
    }, 1000);

    pulseLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.4,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoopRef.current.start();
  } catch (error) {
    console.log(error);

    Alert.alert(
      "Erro",
      "Não foi possível iniciar a gravação."
    );
  }
}

function stopRecordingTimers() {
  if (recordingIntervalRef.current) {
    clearInterval(recordingIntervalRef.current);
    recordingIntervalRef.current = null;
  }

  pulseLoopRef.current?.stop();
  pulseAnim.setValue(1);
}

async function stopRecording() {
  if (!recording || !user || !id) {
    return;
  }

  setIsRecording(false);
  stopRecordingTimers();

  try {
    await recording.stopAndUnloadAsync();

    const uri = recording.getURI();

    setRecording(null);
    setRecordingDuration(0);

    if (!uri) {
      return;
    }

    const tempId = `pending-${Date.now()}`;

    setPendingMessages((prev) => [
      ...prev,
      {
        id: tempId,
        senderId: user.id,
        senderName: user.name,
        type: "audio",
        audioUrl: uri,
        createdAt: { toDate: () => new Date() },
        status: "sent",
        sending: true,
      },
    ]);

    try {
      const audioUrl = await uploadAudio(uri);

      await sendMessage({
        conversationId: id,
        senderId: user.id,
        senderName: user.name,
        type: "audio",
        audioUrl,
      });
    } finally {
      setPendingMessages((prev) =>
        prev.filter((message) => message.id !== tempId)
      );
    }
  } catch (error) {
    console.log(error);

    Alert.alert(
      "Erro",
      "Não foi possível enviar o áudio."
    );
  }
}

async function cancelRecording() {
  if (!recording) {
    setIsRecording(false);
    stopRecordingTimers();
    return;
  }

  setIsRecording(false);
  stopRecordingTimers();

  try {
    await recording.stopAndUnloadAsync();
  } catch (error) {
    console.log(error);
  } finally {
    setRecording(null);
    setRecordingDuration(0);
  }
}

async function playAudio(
  messageId: string,
  audioUrl: string
) {
  try {
  
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
    soundRef.current = newSound;
    currentAudioIdRef.current = messageId;
    setPlayingId(messageId);
    setIsPlaying(true);

    await newSound.playAsync();

    await newSound.setRateAsync(
      playbackRate,
      true
    );

    newSound.setOnPlaybackStatusUpdate(
    (status) => {
    if (!status.isLoaded) return;

    if (!isSeekingRef.current) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis ?? 0);
    }

    if (status.didJustFinish) {
      currentAudioIdRef.current = null;
      setPlayingId(null);
      setIsPlaying(false);
      setPosition(0);
      setDuration(0);

      newSound.unloadAsync();
      setSound(null);
      soundRef.current = null;
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

function formatRecordingTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

async function seekAudio(
  messageId: string,
  progress: number
) {
  if (!Number.isFinite(progress)) {
    return;
  }

  // se tiver um carregamento em andamento (áudio sendo trocado),
  // espera ele terminar antes de aplicar o seek
  let targetSound = soundRef.current;

  if (pendingLoadRef.current) {
    targetSound = await pendingLoadRef.current;
  }

  if (!targetSound || currentAudioIdRef.current !== messageId) {
    return;
  }

  const status = await targetSound.getStatusAsync();

  if (!status.isLoaded || !status.durationMillis) {
    return;
  }

  const positionMillis = Math.max(
    0,
    Math.min(status.durationMillis, status.durationMillis * progress)
  );

  setPosition(positionMillis);

  await targetSound.setPositionAsync(positionMillis);
}

async function handleSeekStart(
  messageId: string,
  audioUrl: string
) {
  isSeekingRef.current = true;
  currentAudioIdRef.current = messageId;

  if (playingId === messageId && soundRef.current) {
    return;
  }

  const loadPromise = (async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      setSound(null);
      soundRef.current = null;
    }

    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: audioUrl },
      { shouldPlay: false }
    );

    setSound(newSound);
    soundRef.current = newSound;
    setPlayingId(messageId);
    setIsPlaying(false);
    setPosition(0);
    setDuration(0);

    newSound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) return;

      if (!isSeekingRef.current) {
        setPosition(status.positionMillis);
        setDuration(status.durationMillis ?? 0);
      }

      if (status.didJustFinish) {
        currentAudioIdRef.current = null;
        setPlayingId(null);
        setIsPlaying(false);
        setPosition(0);
        setDuration(0);

        newSound.unloadAsync();
        setSound(null);
        soundRef.current = null;
      }
    });

    return newSound;
  })();

  pendingLoadRef.current = loadPromise;

  try {
    await loadPromise;
  } catch (error) {
    console.log(error);
  } finally {
    pendingLoadRef.current = null;
  }
}

async function handleSeekEnd() {
  isSeekingRef.current = false;
}

async function changePlaybackSpeed() {
  if (!sound) return;

  let nextRate: number;

  switch (playbackRate) {
    case 1:
      nextRate = 1.5;
      break;

    case 1.5:
      nextRate = 2;
      break;

    default:
      nextRate = 1;
      break;
  }

  await sound.setRateAsync(
    nextRate,
    true
  );

  setPlaybackRate(nextRate);
}

function getDocumentInfo(fileName?: string) {
  const extension =
    fileName?.split(".").pop()?.toLowerCase() ?? "";

  switch (extension) {
    case "pdf":
      return {
        icon: "document-text",
        color: "#E53935",
        type: "PDF",
      };

    case "doc":
    case "docx":
      return {
        icon: "document",
        color: "#1976D2",
        type: "WORD",
      };

    case "xls":
    case "xlsx":
      return {
        icon: "grid",
        color: "#2E7D32",
        type: "EXCEL",
      };

    case "ppt":
    case "pptx":
      return {
        icon: "easel",
        color: "#F57C00",
        type: "POWERPOINT",
      };

    case "zip":
    case "rar":
      return {
        icon: "archive",
        color: "#795548",
        type: "ZIP",
      };

    default:
      return {
        icon: "document",
        color: "#607D8B",
        type: "ARQUIVO",
      };
  }
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
            {isOtherUserTyping
              ? "✍️ Digitando..."
              : otherUserOnline
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
        data={[...messages, ...pendingMessages].sort((a, b) => {
          const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : Date.now();
          const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : Date.now();
          return aTime - bTime;
        })}
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
          const isSending = (item as any).sending === true;
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
              <SwipeableMessage
  isMine={isMine}
  disabled={!!item.deleted || isSending}
  onReply={() => {
    if (!item.deleted) {
      setReplyMessage(item);
    }
  }}
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
                <Animated.View
                  style={[
                    styles.messageBubble,
                    isMine
                      ? styles.myMessageBubble
                      : styles.otherMessageBubble,
                    item.type === "image" &&
                      styles.imageMessageBubble,
                    isSending && { opacity: 0.6 },
                    highlightedMessageId === item.id && {
                      backgroundColor: highlightAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [
                          isMine ? "#1677FF" : "#FFFFFF",
                          "#FFE58A",
                        ],
                      }),
                    },
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

                     {item.replyTo.type === "document" ? (
                        <Text
                          numberOfLines={1}
                          style={{
                            color: isMine ? "#FFFFFF" : "#555",
                          }}
                        >
                          📄 {item.replyTo.documentName ?? "Documento"}
                        </Text>
                      ) : null}

                      {item.replyTo.type === "audio" ? (
                        <Text
                          numberOfLines={1}
                          style={{
                            color: isMine ? "#FFFFFF" : "#555",
                          }}
                        >
                          🎤 Áudio
                        </Text>
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
          isSending ? (
            <Ionicons name="time-outline" size={14} color="#FFFFFF" />
          ) : (
            <Ionicons name={statusIcon} size={16} color={item.status === "read" ? "#4FC3F7" : "#FFFFFF"} />
          )
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
    isSending ? (
      <Ionicons name="time-outline" size={14} color="#FFFFFF" />
    ) : (
      <Ionicons
        name={statusIcon}
        size={16}
        color={
          item.status === "read"
            ? "#4FC3F7"
            : "#FFFFFF"
        }
      />
    )
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
  <AudioPlayerV2
  isMine={isMine}
  isPlaying={
    playingId === item.id &&
    isPlaying
  }
  currentTime={
    playingId === item.id
      ? formatTime(position)
      : "0:00"
  }
  duration={
    playingId === item.id
      ? formatTime(duration)
      : "0:00"
  }
  progress={
    playingId === item.id &&
    duration > 0
      ? position / duration
      : 0
  }
  playbackRate={playbackRate}
  messageTime={
    item.createdAt?.toDate
      ? item.createdAt
          .toDate()
          .toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })
      : ""
  }
  status={item.status}
  onPlayPause={() =>
    playAudio(
      item.id,
      item.audioUrl!
    )
  }
 onSeek={(progress) => seekAudio(item.id, progress)}
  onSeekStart={() => handleSeekStart(item.id, item.audioUrl!)}
  onSeekEnd={handleSeekEnd}
  onChangeSpeed={changePlaybackSpeed}
/>
) }

{!item.deleted &&
item.type === "document" &&
item.documentUrl && (() => {

  const info = getDocumentInfo(
    item.documentName
  );

  return (
    <Pressable
      onPress={async () => {
        try {
          await Linking.openURL(
            item.documentUrl!
          );
        } catch {
          Alert.alert(
            "Erro",
            "Não foi possível abrir o documento."
          );
        }
      }}
      onLongPress={() => handleLongPress(item)}
      delayLongPress={300}
      style={{
        width: 250,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: isMine
          ? "rgba(255,255,255,.12)"
          : "#F5F7FA",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 14,
        }}
      >
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 12,
            backgroundColor: info.color,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons
            name={info.icon as any}
            size={28}
            color="#FFF"
          />
        </View>

        <View
          style={{
            flex: 1,
            marginLeft: 12,
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              fontWeight: "700",
              fontSize: 15,
              color: isMine
                ? "#FFF"
                : "#202020",
            }}
          >
            {item.documentName}
          </Text>

          <Text
            style={{
              marginTop: 3,
              fontSize: 12,
              color: isMine
                ? "#EAEAEA"
                : "#777",
            }}
          >
            {info.type}
            {" • "}
            {item.documentSize
              ? `${(
                  item.documentSize /
                  1024 /
                  1024
                ).toFixed(2)} MB`
              : ""}
          </Text>
        </View>
      </View>

      <View
        style={{
          paddingHorizontal: 14,
          paddingBottom: 10,
          flexDirection: "row",
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontSize: 11,
            color: isMine
              ? "#EAEAEA"
              : "#888",
            marginRight: 4,
          }}
        >
          {item.createdAt?.toDate
            ? item.createdAt
                .toDate()
                .toLocaleTimeString(
                  "pt-BR",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )
            : ""}
        </Text>

        {isMine && (
          isSending ? (
            <Ionicons name="time-outline" size={14} color={isMine ? "#FFF" : "#555"} />
          ) : (
            <Ionicons
              name={statusIcon}
              size={16}
              color={
                item.status === "read"
                  ? "#4FC3F7"
                  : "#FFF"
              }
            />
          )
        )}
      </View>
    </Pressable>
  );

})()}
                  </Animated.View>
              </Pressable>
              </SwipeableMessage>
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

{selectedDocument && (
  <View
    style={{
      marginHorizontal: 12,
      marginBottom: 10,
      padding: 12,
      borderRadius: 16,
      backgroundColor: "#F5F7FA",
      flexDirection: "row",
      alignItems: "center",
    }}
  >
    {(() => {
  const info = getDocumentInfo(
    selectedDocument.name
  );

  return (
    <View
      style={{
        width: 54,
        height: 54,
        borderRadius: 14,
        backgroundColor: info.color,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Ionicons
        name={info.icon as any}
        size={30}
        color="#FFF"
      />
    </View>
  );
})()}

    <View
      style={{
        flex: 1,
        marginLeft: 12,
      }}
    >
      <Text
        numberOfLines={1}
        style={{
          fontWeight: "700",
          fontSize: 15,
        }}
      >
        <Text
  style={{
    color: "#666",
    marginTop: 3,
    fontSize: 13,
  }}
>
  {getDocumentInfo(selectedDocument.name).type}
  {" • "}
  {(selectedDocument.size / 1024 / 1024).toFixed(2)} MB
</Text>
      </Text>

      <Text
        style={{
          color: "#666",
          marginTop: 3,
        }}
      >
        {(selectedDocument.size / 1024 / 1024).toFixed(2)} MB
      </Text>
    </View>

    <Pressable
      onPress={() =>
        setSelectedDocument(null)
      }
    >
      <Ionicons
        name="close-circle"
        size={28}
        color="#FF3B30"
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
          : replyMessage.type === "document"
          ? `📄 ${replyMessage.documentName ?? "Documento"}`
          : replyMessage.type === "audio"
          ? "🎤 Áudio"
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
        {isRecording ? (
          <>
            <Pressable
              style={styles.attachButton}
              onPress={cancelRecording}
            >
              <Ionicons
                name="trash-outline"
                size={24}
                color="#FF3B30"
              />
            </Pressable>

            <View style={styles.recordingBar}>
              <Animated.View
                style={[
                  styles.recordingDot,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              />

              <Text style={styles.recordingTimer}>
                {formatRecordingTime(recordingDuration)}
              </Text>

              <Text style={styles.recordingHint}>
                Gravando áudio...
              </Text>
            </View>

            <Pressable
              style={styles.recordingStopButton}
              onPress={stopRecording}
            >
              <Ionicons
                name="send"
                size={20}
                color="#FFFFFF"
              />
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
  style={[
    styles.attachButton,
    isSending && styles.disabledButton,
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
    isSending && styles.disabledButton,
  ]}
  onPress={handleSendDocument}
  disabled={isSending}
>
  <Ionicons
    name="document"
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
  onPress={handleSendLocation}
  disabled={isSending}
>
  <Ionicons
    name="location"
    size={24}
    color="#1677FF"
  />
</Pressable>

<Pressable
  style={[
    styles.attachButton,
    isSending && styles.disabledButton,
  ]}
  onPress={startRecording}
  disabled={isSending}
>
  <Ionicons
    name="mic"
    size={24}
    color="#1677FF"
  />
</Pressable>

            <TextInput
              style={styles.input}
              placeholder="Digite uma mensagem..."
              placeholderTextColor="#929292"
              value={text}
              onChangeText={(value) => {
  setText(value);

  if (!id || !user?.id) {
    return;
  }

  setTyping(id, user.id, value.length > 0);

  if (typingTimeoutRef.current) {
    clearTimeout(typingTimeoutRef.current);
  }

  typingTimeoutRef.current = setTimeout(async () => {
  if (id && user?.id) {
    await setTyping(id, user.id, false);
  }
}, 1000);
}}
              multiline
            />

            <Pressable
              style={[
                styles.sendButton,
                ((!text.trim() &&
                !selectedImage &&
                !selectedDocument) ||
                  isSending) &&
                  styles.disabledButton,
              ]}
              onPress={handleSendMessage}
              disabled={
              (!text.trim() &&
                !selectedImage &&
                !selectedDocument) ||
              isSending
            }
            >
              <Ionicons
                name="send"
                size={21}
                color="#FFFFFF"
              />
            </Pressable>
          </>
        )}
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

recordingBar: {
  flex: 1,
  height: 46,
  borderRadius: 23,
  backgroundColor: "#FFF0F0",
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 14,
  gap: 10,
},

recordingDot: {
  width: 12,
  height: 12,
  borderRadius: 6,
  backgroundColor: "#FF3B30",
},

recordingTimer: {
  fontSize: 15,
  fontWeight: "700",
  color: "#FF3B30",
},

recordingHint: {
  fontSize: 13,
  color: "#999999",
  flex: 1,
},

recordingStopButton: {
  width: 46,
  height: 46,
  borderRadius: 23,
  backgroundColor: "#FF3B30",
  alignItems: "center",
  justifyContent: "center",
},
});
