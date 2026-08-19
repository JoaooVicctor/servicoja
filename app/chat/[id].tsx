import { AudioPlayerV2 } from "@/src/components/AudioPlayerV2";
import { SelectedMediaBar } from "@/src/components/chat/SelectedMediaBar";
import { VideoViewerModal } from "@/src/components/chat/VideoViewerModal";
import { useLocationPicker } from "@/src/contexts/LocationPickerContext";
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
import { uploadVideo } from "@/src/services/video";
import { ChatMessage } from "@/src/types/Chat";
import { Ionicons } from "@expo/vector-icons";
import { useEvent } from "expo";
import { Audio } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import {
  useVideoPlayer,
  VideoView,
} from "expo-video";

import {
  router,
  Stack,
  useLocalSearchParams,
} from "expo-router";

import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
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
  Keyboard,
  LayoutAnimation,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View
} from "react-native";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function ChatVideoMessage({
  uri,
  onOpen,
  onLongPress,
}: {
  uri: string;
  onOpen: (uri: string) => void;
  onLongPress: () => void;
}) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });

  const { isPlaying } = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });

  return (
    <View
      style={{
        width: 220,
        height: 260,
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "#000",
      }}
    >
      <VideoView
        player={player}
        style={{ width: "100%", height: "100%" }}
        contentFit="cover"
        nativeControls={false}
      />

      <Pressable
        onPress={() => onOpen(uri)}
        onLongPress={onLongPress}
        delayLongPress={300}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {!isPlaying && (
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="play" size={28} color="#FFF" />
          </View>
        )}
      </Pressable>
    </View>
  );
}

function UploadProgressBar({
  progress,
  isMine,
}: {
  progress: number;
  isMine: boolean;
}) {
  return (
    <View
      style={[
        styles.uploadProgressBarTrack,
        {
          backgroundColor: isMine
            ? "rgba(255,255,255,0.35)"
            : "#E0E0E0",
        },
      ]}
    >
      <View
        style={[
          styles.uploadProgressBarFill,
          {
            width: `${Math.min(100, Math.max(0, progress))}%`,
            backgroundColor: isMine ? "#FFFFFF" : "#1677FF",
          },
        ]}
      />
    </View>
  );
}

function FailedBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <Pressable onPress={onRetry} style={styles.failedBannerRow}>
      <Ionicons name="alert-circle" size={14} color="#FF3B30" />
      <Text style={styles.failedBannerText}>Falha ao enviar</Text>
      <Text style={styles.failedBannerRetry}>Tentar novamente</Text>
    </Pressable>
  );
}

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
  const disabledRef = useRef(disabled);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (disabledRef.current) return false;

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
  const insets = useSafeAreaInsets();

  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const { user } = useUser();

  const {
  selectedLocation: pickedLocation,
  setSelectedLocation: setPickedLocation,
} = useLocationPicker();


 const flatListRef =
    useRef<FlatList<ChatMessage>>(null);


const previousMessageCountRef = useRef(0);
const isNearBottomRef = useRef(true);
const didInitialScrollRef = useRef(false);

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

  const [selectedImages, setSelectedImages] =
    useState<string[]>([]);

   const [selectedVideos, setSelectedVideos] =
useState<string[]>([]);

    

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

    useEffect(() => {
  if (!pickedLocation) {
    return;
  }

  setSelectedLocation(pickedLocation);

  setPickedLocation(null);
}, [pickedLocation]);

  const [previewVisible, setPreviewVisible] =
    useState(false);

  const [previewImage, setPreviewImage] =
    useState("");

    const [videoViewerVisible, setVideoViewerVisible] =
  useState(false);

const [videoViewerUri, setVideoViewerUri] =
  useState("");

    const [replyMessage, setReplyMessage] =
    useState<ChatMessage | null>(null);

    const [highlightedMessageId, setHighlightedMessageId] =
    useState<string | null>(null);

    const [pendingMessages, setPendingMessages] =
    useState<any[]>([]);


    useEffect(() => {
      pendingMessagesRef.current = pendingMessages;
    }, [pendingMessages]);

    useEffect(() => {
      if (!id) return;

      async function loadPendingMessages() {
        try {
          const stored = await AsyncStorage.getItem(
            `pending-messages-${id}`
          );

          if (!stored) return;

          const parsed = JSON.parse(stored);

          if (!Array.isArray(parsed) || parsed.length === 0) return;

          const restored = parsed.map((message: any) => ({
            ...message,
            sending: false,
            failed: true,
            createdAt: { toDate: () => new Date() },
          }));

          setPendingMessages(restored);
        } catch (error) {
          console.log("Erro ao carregar mensagens pendentes:", error);
        }
      }

      loadPendingMessages();
    }, [id]);

    useEffect(() => {
      if (!id) return;

      AsyncStorage.setItem(
        `pending-messages-${id}`,
        JSON.stringify(pendingMessages)
      ).catch((error) => {
        console.log("Erro ao salvar mensagens pendentes:", error);
      });
    }, [pendingMessages, id]);

    const pendingMessagesRef = useRef<any[]>([]);

    useEffect(() => {
      pendingMessagesRef.current = pendingMessages;
    }, [pendingMessages]);

    const sendingIdsRef = useRef<Set<string>>(new Set());

    const highlightAnim = useRef(new Animated.Value(0)).current;

    const [selectedMessage, setSelectedMessage] =
    useState<ChatMessage | null>(null);


    const [menuVisible, setMenuVisible] =
  useState(false);

  const [attachMenuVisible, setAttachMenuVisible] =
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

const [keyboardHeight, setKeyboardHeight] = useState(0);
const [keyboardVisible, setKeyboardVisible] = useState(false);


function scrollToEndAfterKeyboard() {
  flatListRef.current?.scrollToEnd({
    animated: false,
  });
}
const [stickyBarHeight, setStickyBarHeight] = useState(80);

const inputBottomPadding = keyboardVisible
  ? 10
  : Math.max(insets.bottom, 12);

const headerTopPadding =
  Platform.OS === "web" ? 18 : insets.top + 10;

  useEffect(() => {
  if (!id || !user?.id) {
    return;
  }

  const userReference = doc(
    db,
    "users",
    user.id
  );

  updateDoc(userReference, {
    activeConversationId: id,
    activeConversationUpdatedAt:
      serverTimestamp(),
  }).catch((error) => {
    console.log(
      "Erro ao marcar conversa ativa:",
      error
    );
  });

  return () => {
    updateDoc(userReference, {
      activeConversationId: null,
      activeConversationUpdatedAt:
        serverTimestamp(),
    }).catch((error) => {
      console.log(
        "Erro ao limpar conversa ativa:",
        error
      );
    });
  };
}, [id, user?.id]);

  useEffect(() => {
  didInitialScrollRef.current = false;
  previousMessageCountRef.current = 0;
  isNearBottomRef.current = true;
}, [id]);

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
    const total = messages.length + pendingMessages.length;

    if (total > previousMessageCountRef.current && isNearBottomRef.current) {
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      });
    }

    previousMessageCountRef.current = total;
  }, [messages, pendingMessages]);

useEffect(() => {
  const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
    const wasNearBottom = isNearBottomRef.current;

    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        250,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity
      )
    );

    setKeyboardVisible(true);
    setKeyboardHeight(e.endCoordinates.height);

    if (wasNearBottom) {
      setTimeout(scrollToEndAfterKeyboard, 80);
    }
  });

  const hideSub = Keyboard.addListener("keyboardDidHide", () => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        250,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity
      )
    );

    setKeyboardVisible(false);
    setKeyboardHeight(0);
  });

  return () => {
    showSub.remove();
    hideSub.remove();
  };
}, []);


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

function formatLastSeen(lastSeen: Timestamp | null) {
  if (!lastSeen) {
    return "Offline";
  }

  const lastSeenDate = lastSeen.toDate();
  const now = new Date();

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const lastSeenDay = new Date(
    lastSeenDate.getFullYear(),
    lastSeenDate.getMonth(),
    lastSeenDate.getDate()
  );

  const time = lastSeenDate.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (lastSeenDay.getTime() === today.getTime()) {
    return `Visto por último hoje às ${time}`;
  }

  if (lastSeenDay.getTime() === yesterday.getTime()) {
    return `Visto por último ontem às ${time}`;
  }

  const date = lastSeenDate.toLocaleDateString("pt-BR");

  return `Visto por último em ${date} às ${time}`;
}

 async function handleSendMessage() {
  if (!user || !id || isSending) {
    return;
  }

if (
  !text.trim() &&
  selectedImages.length === 0 &&
  selectedVideos.length === 0 &&
  !selectedDocument &&
  !selectedLocation
) {
  return;
}

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

      ...(replyMessage.videoUrl && {
        videoUrl: replyMessage.videoUrl,
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

  let pendingList: any[] = [];

  if (selectedImages.length > 0) {
    pendingList = selectedImages.map((uri, index) => ({
      id: `pending-${Date.now()}-${index}`,
      senderId: user.id,
      senderName: user.name,
      type: "image",
      imageUrl: uri,
      text: index === selectedImages.length - 1 ? text.trim() : "",
      createdAt: { toDate: () => new Date() },
      status: "sent",
      sending: true,
      failed: false,
      progress: 0,
      replyTo: replyData,
    }));

    setSelectedImages([]);
  } else if (selectedVideos.length > 0) {
  pendingList = selectedVideos.map((videoUri, index) => ({
    id: `pending-${Date.now()}-${index}`,
    senderId: user.id,
    senderName: user.name,
    type: "video",
    videoUrl: videoUri,
    text: index === 0 ? text.trim() : "",
    createdAt: { toDate: () => new Date() },
    status: "sent",
    sending: true,
    failed: false,
    progress: 0,
    replyTo: replyData,
  }));

  setSelectedVideos([]);
} else if (selectedDocument) {
    pendingList = [{
      id: `pending-${Date.now()}`,
      senderId: user.id,
      senderName: user.name,
      type: "document",
      localUri: selectedDocument.uri,
      mimeType: selectedDocument.mimeType,
      documentName: selectedDocument.name,
      documentSize: selectedDocument.size,
      createdAt: { toDate: () => new Date() },
      status: "sent",
      sending: true,
      failed: false,
      progress: 0,
      replyTo: replyData,
    }];

    setSelectedDocument(null);
  } else if (selectedLocation) {
    pendingList = [{
      id: `pending-${Date.now()}`,
      senderId: user.id,
      senderName: user.name,
      type: "location",
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      locationAddress: selectedLocation.address,
      createdAt: { toDate: () => new Date() },
      status: "sent",
      sending: true,
      failed: false,
      replyTo: replyData,
    }];

    setSelectedLocation(null);
  } else {
    pendingList = [{
      id: `pending-${Date.now()}`,
      senderId: user.id,
      senderName: user.name,
      type: "text",
      text: text.trim(),
      createdAt: { toDate: () => new Date() },
      status: "sent",
      sending: true,
      failed: false,
      replyTo: replyData,
    }];

    setTyping(id, user.id, false);
  }

  const connection = await NetInfo.fetch();

const isOffline =
  connection.isConnected !== true ||
  connection.isInternetReachable !== true;

if (isOffline) {
  setPendingMessages((prev) => [
    ...prev,
    ...pendingList.map((message) => ({
      ...message,
      sending: false,
      failed: true,
      progress: 0,
    })),
  ]);

  setText("");
  setReplyMessage(null);
  setIsSending(false);

  isNearBottomRef.current = true;

  requestAnimationFrame(() => {
    flatListRef.current?.scrollToEnd({
      animated: true,
    });
  });

  return;
}

  setPendingMessages((prev) => [...prev, ...pendingList]);
  setText("");
  setReplyMessage(null);

  isNearBottomRef.current = true;

  requestAnimationFrame(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  });

  await Promise.all(pendingList.map((pendingMsg) => attemptSend(pendingMsg)));

  setIsSending(false);
}

async function compressImage(uri: string) {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [
      {
        resize: {
          width: 1280,
        },
      },
    ],
    {
      compress: 0.6,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  return result.uri;
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
      mediaTypes: ["images", "videos"],
      allowsEditing: false,
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 0.8,
    });

    if (result.canceled) return;

    const files = result.assets.filter((asset) => asset.uri);

    if (files.length === 0) {
      return;
    }

    const videos = files.filter((file) => file.type === "video");
    const images = files.filter((file) => file.type !== "video");

   if (videos.length > 0) {
  setSelectedVideos((prev) => [
    ...prev,
    ...videos.map((video) => video.uri),
  ]);
}

    if (images.length > 0) {
  const compressedImages = await Promise.all(
    images.map((file) => compressImage(file.uri))
  );

  setSelectedImages((prev) => [
    ...prev,
    ...compressedImages,
  ]);
}

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

function withTimeout<T>(
  promise: Promise<T>,
  seconds = 20
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            "Tempo limite excedido. Verifique sua internet."
          )
        );
      }, seconds * 1000);
    }),
  ]);
}

function canFinishPendingMessage(messageId: string) {
  const message = pendingMessagesRef.current.find(
    (item) => item.id === messageId
  );

  return (
    message &&
    message.sending === true &&
    message.failed !== true
  );
}

function updateMessageProgress(tempId: string, percent: number) {
  setPendingMessages((prev) =>
    prev.map((message) =>
      message.id === tempId
        ? { ...message, progress: percent }
        : message
    )
  );
}

async function performSend(pendingMsg: any) {
  const replyTo = pendingMsg.replyTo;

  if (pendingMsg.type === "image") {
    const imageUrl = await uploadImage(
  pendingMsg.imageUrl,
  (percent) => updateMessageProgress(pendingMsg.id, percent)
);

if (!canFinishPendingMessage(pendingMsg.id)) {
  return;
}

await sendMessage({
      conversationId: id as string,
      senderId: user!.id,
      senderName: user!.name,
      type: "image",
      imageUrl,
      text: pendingMsg.text,
      replyTo,
    });
  } else if (pendingMsg.type === "video") {
    const videoUrl = await uploadVideo(
      pendingMsg.videoUrl,
      (percent) => updateMessageProgress(pendingMsg.id, percent)
    );

    await sendMessage({
      conversationId: id as string,
      senderId: user!.id,
      senderName: user!.name,
      type: "video",
      videoUrl,
      text: pendingMsg.text,
      replyTo,
    });
  } else if (pendingMsg.type === "document") {
    const documentUrl = await uploadDocument(
      pendingMsg.localUri,
      pendingMsg.documentName,
      pendingMsg.mimeType,
      (percent) => updateMessageProgress(pendingMsg.id, percent)
    );

    await sendMessage({
      conversationId: id as string,
      senderId: user!.id,
      senderName: user!.name,
      type: "document",
      documentUrl,
      documentName: pendingMsg.documentName,
      documentSize: pendingMsg.documentSize,
      replyTo,
    });
  } else if (pendingMsg.type === "audio") {
    const audioUrl = await uploadAudio(
      pendingMsg.audioUrl,
      (percent) => updateMessageProgress(pendingMsg.id, percent)
    );

    await sendMessage({
      conversationId: id as string,
      senderId: user!.id,
      senderName: user!.name,
      type: "audio",
      audioUrl,
      replyTo,
    });
  } else if (pendingMsg.type === "location") {
    await sendMessage({
      conversationId: id as string,
      senderId: user!.id,
      senderName: user!.name,
      type: "location",
      latitude: pendingMsg.latitude,
      longitude: pendingMsg.longitude,
      locationAddress: pendingMsg.locationAddress,
      replyTo,
    });
  } else {
    await sendMessage({
      conversationId: id as string,
      senderId: user!.id,
      senderName: user!.name,
      type: "text",
      text: pendingMsg.text,
      replyTo,
    });
  }
}

async function attemptSend(pendingMsg: any) {
  if (sendingIdsRef.current.has(pendingMsg.id)) {
    return;
  }

  sendingIdsRef.current.add(pendingMsg.id);

  try {
    const timeoutSeconds =
      pendingMsg.type === "video"
        ? 60
        : pendingMsg.type === "image"
        ? 45
        : pendingMsg.type === "audio"
        ? 45
        : pendingMsg.type === "document"
        ? 45
        : 20;

    await withTimeout(
      performSend(pendingMsg),
      timeoutSeconds
    );

    setPendingMessages((prev) =>
      prev.filter(
        (message) => message.id !== pendingMsg.id
      )
    );
  } catch (error) {
    console.log("Falha ao enviar mensagem:", error);

    setPendingMessages((prev) =>
      prev.map((message) =>
        message.id === pendingMsg.id
          ? {
              ...message,
              sending: false,
              failed: true,
            }
          : message
      )
    );
  } finally {
    sendingIdsRef.current.delete(pendingMsg.id);
  }
}

async function retryMessage(pendingMsg: any) {
  if (!user || !id) {
    return;
  }

  const connection = await NetInfo.fetch();

  const hasInternet =
    connection.isConnected === true &&
    connection.isInternetReachable === true;

  if (!hasInternet) {
    setPendingMessages((prev) =>
      prev.map((message) =>
        message.id === pendingMsg.id
          ? {
              ...message,
              sending: false,
              failed: true,
              progress: 0,
            }
          : message
      )
    );

    return;
  }

  const resetMsg = {
    ...pendingMsg,
    sending: true,
    failed: false,
    progress: 0,
  };

  setPendingMessages((prev) =>
    prev.map((message) =>
      message.id === pendingMsg.id
        ? resetMsg
        : message
    )
  );

  isNearBottomRef.current = true;

  requestAnimationFrame(() => {
    flatListRef.current?.scrollToEnd({
      animated: true,
    });
  });

  await attemptSend(resetMsg);
}

function handleLongPress(item: ChatMessage) {
  if (
    item.deleted ||
    item.hiddenForMe ||
    String(item.id).startsWith("pending-")
  ) {
    return;
  }

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

function handleScroll(event: any) {
  const { contentOffset, contentSize, layoutMeasurement } =
    event.nativeEvent;

  const distanceFromBottom =
    contentSize.height - (contentOffset.y + layoutMeasurement.height);

  isNearBottomRef.current = distanceFromBottom < 120;
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

    const pendingMsg = {
      id: `pending-${Date.now()}`,
      senderId: user.id,
      senderName: user.name,
      type: "audio",
      audioUrl: uri,
      createdAt: { toDate: () => new Date() },
      status: "sent",
      sending: true,
      failed: false,
      progress: 0,
    };

    setPendingMessages((prev) => [...prev, pendingMsg]);

    isNearBottomRef.current = true;

    requestAnimationFrame(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    });

    await attemptSend(pendingMsg);
  } catch (error) {
    console.log(error);

    Alert.alert(
      "Erro",
      "Não foi possível gravar o áudio."
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
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View
  style={[
    styles.header,
    {
      paddingTop: headerTopPadding,
    },
  ]}
>
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
  ? " Digitando..."
  : otherUserOnline
  ? "🟢 Online"
  : formatLastSeen(otherUserLastSeen)}
          </Text>
          </View>
        </View>
      </View>

    <FlatList
        ref={flatListRef}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        onScroll={handleScroll}
scrollEventThrottle={16}
onContentSizeChange={() => {
  const total =
    messages.length + pendingMessages.length;

  if (total === 0 || didInitialScrollRef.current) {
    return;
  }

  didInitialScrollRef.current = true;

  requestAnimationFrame(() => {
    flatListRef.current?.scrollToEnd({
      animated: false,
    });
  });
}}
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
      contentContainerStyle={styles.messagesContent}
ListFooterComponent={
  <View
    style={{
      height: keyboardVisible
        ? keyboardHeight + stickyBarHeight + 0
        : 8,
    }}
  />
}
        
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

            const repliedOriginal = item.replyTo
            ? messages.find((m) => m.id === item.replyTo!.id)
            : undefined;

          const repliedWasDeleted =
            !!repliedOriginal &&
            (repliedOriginal.deleted || repliedOriginal.hiddenForMe);

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
  disabled={
    !!item.deleted ||
    !!item.hiddenForMe ||
    isSending
  }
  onReply={() => {
    if (
      item.deleted ||
      item.hiddenForMe
    ) {
      return;
    }

    setReplyMessage(item);
  }}
>
              <Pressable  
                  disabled={
  item.deleted ||
  item.hiddenForMe
}
                  onLongPress={() => {
  if (
    item.deleted ||
    item.hiddenForMe
  ) {
    return;
  }

  handleLongPress(item);
}}
                style={{
                  maxWidth: "76%",
                  alignSelf: isMine ? "flex-end" : "flex-start",
                }}
              >
               <Animated.View
                    onTouchEnd={(event) => {
                      if (item.replyTo?.id) {
                        event.stopPropagation();
                        scrollToReply(item.replyTo.id);
                      }
                    }}
                    style={[
                    styles.messageBubble,
                    isMine
                      ? styles.myMessageBubble
                      : styles.otherMessageBubble,
                    (item.type === "image" || item.type === "video") &&
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
                  !item.hiddenForMe &&
                  item.replyTo && (
                   <Pressable
                        disabled={repliedWasDeleted}
                        hitSlop={6}
                        onPress={(event) => {
                          event.stopPropagation();

                          if (!item.replyTo?.id || repliedWasDeleted) {
                            return;
                          }

                          scrollToReply(item.replyTo.id);
                        }}
                        onLongPress={(event) => {
                          event.stopPropagation();
                          handleLongPress(item);
                        }}
                        delayLongPress={300}
                        style={{
                        width: "100%",
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

                      {repliedWasDeleted ? (
                        <Text
                          style={{
                            fontStyle: "italic",
                            color: isMine ? "#EAEAEA" : "#777",
                          }}
                        >
                          🚫 Mensagem apagada
                        </Text>
                      ) : (
                        <>
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

                   {item.replyTo.type === "video" ? (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
    }}
  >
    <View
      style={{
        width: 55,
        height: 55,
        borderRadius: 8,
        backgroundColor: "#111",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 8,
      }}
    >
      <Ionicons
        name="play"
        size={24}
        color="#FFF"
      />
    </View>

    <Text
      numberOfLines={1}
      style={{
        color: isMine ? "#FFFFFF" : "#555",
        flex: 1,
      }}
    >
      Vídeo
    </Text>
  </View>
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
                        </>
                      )}
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
      maxWidth: "100%",
      flexDirection: "row",
      alignItems: "flex-end",
    }}
  >
    <Text
      style={[
        styles.messageText,
        isMine && styles.myMessageText,
        {
          flexShrink: 1,
          flexWrap: "wrap",
        },
      ]}
    >
      {item.text}
    </Text>

    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginLeft: 8,
        marginBottom: 1,
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

      {isMine &&
        ((item as any).failed ? (
          <Ionicons
            name="alert-circle"
            size={14}
            color="#FF3B30"
          />
        ) : isSending ? (
          <Ionicons
            name="time-outline"
            size={14}
            color="#FFFFFF"
          />
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
        ))}
    </View>
  </View>
)
)}

{(item as any).failed && (
  <FailedBanner onRetry={() => retryMessage(item)} />
)}

                 {!item.deleted &&
                  !item.hiddenForMe &&
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
    (item as any).failed ? (
      <Ionicons name="alert-circle" size={14} color="#FF3B30" />
    ) : isSending ? (
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

                        {isSending &&
                          typeof (item as any).progress === "number" && (
                            <UploadProgressBar
                              progress={(item as any).progress}
                              isMine={isMine}
                            />
                          )}

                        {(item as any).failed && (
                          <FailedBanner onRetry={() => retryMessage(item)} />
                        )}
                      </Pressable>
                  )}
                 {!item.deleted &&
                  !item.hiddenForMe &&
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
  !item.hiddenForMe &&
  item.type === "video" &&
  item.videoUrl && (
    <>
      <ChatVideoMessage
        uri={item.videoUrl!}
        onOpen={(uri) => {
          setVideoViewerUri(uri);
          setVideoViewerVisible(true);
        }}
        onLongPress={() => handleLongPress(item)}
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
          (item as any).failed ? (
            <Ionicons
              name="alert-circle"
              size={14}
              color="#FF3B30"
            />
          ) : isSending ? (
            <Ionicons
              name="time-outline"
              size={14}
              color="#FFFFFF"
            />
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

      {isSending &&
        typeof (item as any).progress === "number" && (
          <UploadProgressBar
            progress={(item as any).progress}
            isMine={isMine}
          />
        )}

      {(item as any).failed && (
        <FailedBanner onRetry={() => retryMessage(item)} />
      )}

      {item.text && (
        <Text
          style={[
            styles.imageCaption,
            isMine && styles.myMessageText,
          ]}
        >
          {item.text}
        </Text>
      )}
    </>
)}

                {!item.deleted &&
!item.hiddenForMe &&
!item.deleted &&
!item.hiddenForMe &&
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

{item.type === "audio" &&
  (item as any).failed && (
    <FailedBanner onRetry={() => retryMessage(item)} />
  )}

{!item.deleted &&
!item.hiddenForMe &&
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
          (item as any).failed ? (
            <Ionicons name="alert-circle" size={14} color="#FF3B30" />
          ) : isSending ? (
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

      {isSending &&
        typeof (item as any).progress === "number" && (
          <View style={{ paddingHorizontal: 14, paddingBottom: 10 }}>
            <UploadProgressBar
              progress={(item as any).progress}
              isMine={isMine}
            />
          </View>
        )}

      {(item as any).failed && (
        <View style={{ paddingHorizontal: 14, paddingBottom: 10 }}>
          <FailedBanner onRetry={() => retryMessage(item)} />
        </View>
      )}
    </Pressable>
  );

})()}

{!item.deleted &&
!item.hiddenForMe &&
item.type === "location" &&
item.latitude !== undefined &&
item.longitude !== undefined && (

  <Pressable
    onPress={() =>
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`
      )
    }
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
    <>
  <Image
    source={{
      uri: `https://staticmap.openstreetmap.de/staticmap.php?center=${item.latitude},${item.longitude}&zoom=16&size=600x300&markers=${item.latitude},${item.longitude},red-pushpin`,
    }}
    style={{
      width: "100%",
      height: 150,
      backgroundColor: "#EEE",
    }}
    resizeMode="cover"
  />

  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
    }}
  >
    <View
      style={{
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "#34A853",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Ionicons
        name="location"
        size={22}
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
        style={{
          fontWeight: "700",
          color: isMine
            ? "#FFF"
            : "#202020",
        }}
      >
        Localização compartilhada
      </Text>

      <Text
        numberOfLines={2}
        style={{
          marginTop: 4,
          color: isMine
            ? "#EAEAEA"
            : "#666",
          fontSize: 13,
        }}
      >
        {item.locationAddress}
      </Text>
    </View>
  </View>
</>

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
              .toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })
          : ""}
      </Text>

     {isMine && (
        (item as any).failed ? (
          <Ionicons name="alert-circle" size={14} color="#FF3B30" />
        ) : isSending ? (
          <Ionicons
            name="time-outline"
            size={14}
            color="#FFF"
          />
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

    {(item as any).failed && (
      <View style={{ paddingHorizontal: 14, paddingBottom: 10 }}>
        <FailedBanner onRetry={() => retryMessage(item)} />
      </View>
    )}
  </Pressable>
)}

                  </Animated.View>
              </Pressable>
              </SwipeableMessage>
            </View>
          );
        }}
      />

   <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
  <View
    onLayout={(event) => {
      setStickyBarHeight(event.nativeEvent.layout.height);
    }}
  >
       <SelectedMediaBar
  images={selectedImages}
  videos={selectedVideos}
  onRemoveImage={(index) =>
    setSelectedImages((prev) =>
      prev.filter((_, i) => i !== index)
    )
  }
  onRemoveVideo={(index) =>
    setSelectedVideos((prev) =>
      prev.filter((_, i) => i !== index)
    )
  }
/>

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

{selectedLocation && (
  <View
    style={{
      marginHorizontal: 12,
      marginBottom: 10,
      padding: 14,
      borderRadius: 16,
      backgroundColor: "#F5F7FA",
      flexDirection: "row",
      alignItems: "center",
    }}
  >
    <View
      style={{
        width: 54,
        height: 54,
        borderRadius: 14,
        backgroundColor: "#34A853",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Ionicons
        name="location"
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
        numberOfLines={2}
        style={{
          fontWeight: "700",
          fontSize: 15,
        }}
      >
        Compartilhar localização
      </Text>

      <Text
        numberOfLines={2}
        style={{
          marginTop: 3,
          color: "#666",
        }}
      >
        {selectedLocation.address}
      </Text>
    </View>

    <Pressable
      onPress={() =>
        setSelectedLocation(null)
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

     <View
  style={{
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    paddingRight: 35,
  }}
>
  {replyMessage.type === "image" &&
  replyMessage.imageUrl ? (
    <Image
      source={{ uri: replyMessage.imageUrl }}
      style={{
        width: 42,
        height: 42,
        borderRadius: 8,
        marginRight: 8,
      }}
    />
  ) : replyMessage.type === "video" ? (
    <View
      style={{
        width: 42,
        height: 42,
        borderRadius: 8,
        marginRight: 8,
        backgroundColor: "#111",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Ionicons
        name="videocam"
        size={22}
        color="#FFF"
      />
    </View>
  ) : null}

  <Text
    numberOfLines={1}
    style={{
      color: "#555",
      flex: 1,
    }}
  >
    {replyMessage.type === "image"
      ? replyMessage.text || "Foto"
      : replyMessage.type === "video"
      ? replyMessage.text || "Vídeo"
      : replyMessage.type === "document"
      ? `📄 ${replyMessage.documentName ?? "Documento"}`
      : replyMessage.type === "audio"
      ? "🎤 Áudio"
      : replyMessage.text}
  </Text>
</View>
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

        <View
  style={[
    styles.inputContainer,
    {
      paddingBottom: inputBottomPadding,
    },
  ]}
>
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
  onPress={() => setAttachMenuVisible(true)}
  disabled={isSending}
>
  <Ionicons
    name="add-circle"
    size={30}
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

           <Pressable
  style={[
    styles.sendButton,
    (
      (
        !text.trim() &&
        selectedImages.length === 0 &&
        selectedVideos.length === 0 &&
        !selectedDocument &&
        !selectedLocation
      ) ||
      isSending
    ) && styles.disabledButton,
  ]}
  onPress={handleSendMessage}
  disabled={
    (
      !text.trim() &&
      selectedImages.length === 0 &&
      selectedVideos.length === 0 &&
      !selectedDocument &&
      !selectedLocation
    ) || isSending
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
        </View>
      </KeyboardStickyView>

      {attachMenuVisible && (
        <Pressable
          style={styles.sheetOverlay}
          onPress={() => setAttachMenuVisible(false)}
        >
          <Pressable
            style={[styles.sheetContainer, { marginBottom: keyboardHeight }]}
            onPress={() => {}}
          >
            <View style={styles.sheetHandle} />

            <View style={styles.attachGrid}>
              <Pressable
                style={styles.attachGridItem}
                onPress={() => {
                  setAttachMenuVisible(false);
                  handleSendImage();
                }}
              >
                <View style={[styles.attachGridIcon, { backgroundColor: "#9C27B0" }]}>
                  <Ionicons name="image" size={26} color="#FFF" />
                </View>
                <Text style={styles.attachGridLabel}>Galeria</Text>
              </Pressable>

              <Pressable
                style={styles.attachGridItem}
                onPress={() => {
                  setAttachMenuVisible(false);
                  handleSendDocument();
                }}
              >
                <View style={[styles.attachGridIcon, { backgroundColor: "#1976D2" }]}>
                  <Ionicons name="document" size={26} color="#FFF" />
                </View>
                <Text style={styles.attachGridLabel}>Documento</Text>
              </Pressable>

              <Pressable
                style={styles.attachGridItem}
                onPress={() => {
                  setAttachMenuVisible(false);
                  router.push("/chat/location-picker");
                }}
              >
                <View style={[styles.attachGridIcon, { backgroundColor: "#34A853" }]}>
                  <Ionicons name="location" size={26} color="#FFF" />
                </View>
                <Text style={styles.attachGridLabel}>Localização</Text>
              </Pressable>
            </View>

            <Pressable
              style={styles.sheetCancelButton}
              onPress={() => setAttachMenuVisible(false)}
            >
              <Text style={styles.sheetCancelText}>Cancelar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      )}

      {menuVisible && (
        <Pressable
          style={styles.sheetOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <Pressable
            style={[styles.sheetContainer, { marginBottom: keyboardHeight }]}
            onPress={() => {}}
          >
            <View style={styles.sheetHandle} />

            <Pressable
              style={styles.menuRow}
              onPress={() => {
                if (
                  selectedMessage &&
                  !selectedMessage.deleted &&
                  !selectedMessage.hiddenForMe
                ) {
                  setReplyMessage(selectedMessage);
                }

                setSelectedMessage(null);
                setMenuVisible(false);
              }}
            >
              <View style={[styles.menuRowIcon, { backgroundColor: "#E8F1FF" }]}>
                <Ionicons name="return-up-back" size={20} color="#1677FF" />
              </View>
              <Text style={styles.menuRowText}>Responder</Text>
            </Pressable>

            {selectedMessage &&
              (() => {
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
                        style={styles.menuRow}
                        onPress={async () => {
                          if (!id || !user?.id || !selectedMessage) return;

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
                        <View style={[styles.menuRowIcon, { backgroundColor: "#FDECEC" }]}>
                          <Ionicons name="trash" size={20} color="#E53935" />
                        </View>
                        <Text style={[styles.menuRowText, { color: "#E53935" }]}>
                          Apagar para todos
                        </Text>
                      </Pressable>
                    )}

                    {!selectedMessage.deleted && (
                      <Pressable
                        style={styles.menuRow}
                        onPress={async () => {
                          if (!id || !user?.id || !selectedMessage) return;

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
                        <View style={[styles.menuRowIcon, { backgroundColor: "#F0F2F5" }]}>
                          <Ionicons name="trash-outline" size={20} color="#555" />
                        </View>
                        <Text style={styles.menuRowText}>Apagar para mim</Text>
                      </Pressable>
                    )}
                  </>
                );
              })()}

            <Pressable
              style={styles.sheetCancelButton}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={styles.sheetCancelText}>Cancelar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      )}

      {previewVisible && (
  <Pressable
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.95)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 50,
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
      )}

      <VideoViewerModal
  visible={videoViewerVisible}
  uri={videoViewerUri}
  onClose={() => setVideoViewerVisible(false)}
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
  paddingTop: 0,
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
  justifyContent: "flex-end",
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
  paddingHorizontal: 2,
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
  paddingBottom: 0,
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

attachMenuOption: {
  flexDirection: "row",
  alignItems: "center",
  padding: 16,
  gap: 14,
},

attachMenuIcon: {
  width: 44,
  height: 44,
  borderRadius: 22,
  justifyContent: "center",
  alignItems: "center",
},

attachMenuText: {
  fontSize: 16,
  color: "#202020",
  fontWeight: "600",
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

sheetOverlay: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.4)",
  justifyContent: "flex-end",
  zIndex: 50,
},

sheetContainer: {
  backgroundColor: "#FFFFFF",
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  paddingTop: 10,
  paddingBottom: Platform.OS === "ios" ? 30 : 16,
  paddingHorizontal: 16,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: -4 },
  shadowOpacity: 0.15,
  shadowRadius: 12,
  elevation: 12,
},

sheetHandle: {
  width: 40,
  height: 4,
  borderRadius: 2,
  backgroundColor: "#DDD",
  alignSelf: "center",
  marginBottom: 16,
},

sheetCancelButton: {
  backgroundColor: "#F0F2F5",
  borderRadius: 14,
  paddingVertical: 14,
  alignItems: "center",
  marginTop: 8,
},

sheetCancelText: {
  fontSize: 15,
  fontWeight: "700",
  color: "#333",
},

attachGrid: {
  flexDirection: "row",
  justifyContent: "space-around",
  marginBottom: 20,
},

attachGridItem: {
  alignItems: "center",
  gap: 8,
},

attachGridIcon: {
  width: 58,
  height: 58,
  borderRadius: 29,
  justifyContent: "center",
  alignItems: "center",
},

attachGridLabel: {
  fontSize: 13,
  color: "#333",
  fontWeight: "600",
},

menuRow: {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: 12,
  gap: 14,
},

menuRowIcon: {
  width: 38,
  height: 38,
  borderRadius: 19,
  justifyContent: "center",
  alignItems: "center",
},

menuRowText: {
  fontSize: 15,
  fontWeight: "600",
  color: "#202020",
},

uploadProgressBarTrack: {
  height: 4,
  borderRadius: 2,
  overflow: "hidden",
  marginTop: 6,
},

uploadProgressBarFill: {
  height: "100%",
},

failedBannerRow: {
  flexDirection: "row",
  alignItems: "center",
  marginTop: 6,
  gap: 6,
},

failedBannerText: {
  fontSize: 12,
  color: "#FF3B30",
  fontWeight: "600",
},

failedBannerRetry: {
  fontSize: 12,
  color: "#1677FF",
  fontWeight: "700",
  marginLeft: 4,
},
});

