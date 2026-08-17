import { db } from "@/src/services/firebase";
import { sendPushNotifications } from "@/src/services/notifications";
import type {
  MessageType,
  ReplyMessage,
} from "@/src/types/Chat";

import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Unsubscribe,
  updateDoc,
  where
} from "firebase/firestore";


export interface StartConversationData {
  serviceId: string;
  serviceTitle: string;
  serviceImage?: string;

  customerId: string;
  customerName: string;
  customerPhoto?: string;

  ownerId: string;
  ownerName: string;
  ownerPhoto?: string;
}

export interface SendMessageData {
  conversationId: string;

  senderId: string;
  senderName: string;

  type: MessageType;

  text?: string;

  imageUrl?: string;

  videoUrl?: string;

  audioUrl?: string;
  duration?: number;

  documentUrl?: string;
  documentName?: string;
  documentSize?: number;

  latitude?: number;
  longitude?: number;
  locationAddress?: string;

  replyTo?: ReplyMessage;
}


export async function startConversation(
  data: StartConversationData
): Promise<string> {
  const {
  serviceId,
  serviceTitle,
  serviceImage,
  customerId,
  customerName,
  customerPhoto,
  ownerId,
  ownerName,
  ownerPhoto,
} = data;

  if (!serviceId) {
    throw new Error(
      "O ID do serviço não foi informado."
    );
  }

  if (!customerId || !ownerId) {
    throw new Error(
      "Os participantes da conversa não foram informados."
    );
  }

  if (customerId === ownerId) {
    throw new Error(
      "Você não pode iniciar uma conversa com você mesmo."
    );
  }

  const conversationsReference =
    collection(db, "conversations");


  const existingConversationQuery = query(
    conversationsReference,
    where(
      "participantIds",
      "array-contains",
      customerId
    ),
    limit(30)
  );

  const existingConversationSnapshot =
    await getDocs(existingConversationQuery);

  const existingConversation =
    existingConversationSnapshot.docs.find(
      (conversationDocument) => {
        const conversationData =
          conversationDocument.data();

        return (
          conversationData.serviceId ===
            serviceId &&
          conversationData.customerId ===
            customerId &&
          conversationData.ownerId === ownerId
        );
      }
    );

  if (existingConversation) {
  await updateDoc(
    doc(
      db,
      "conversations",
      existingConversation.id
    ),
    {
      hiddenFor: arrayRemove(customerId),
    }
  );

  return existingConversation.id;
}

  const conversationReference = doc(
    conversationsReference
  );

  const conversationData: Record<
    string,
    unknown
  > = {
    serviceId,
    serviceTitle,

    participantIds: [
      customerId,
      ownerId,
    ],

    customerId,
    customerName,
    customerPhoto,

    ownerId,
    ownerName,
    ownerPhoto,

   lastMessage: "",
lastMessageAt: serverTimestamp(),

unreadCounts: {
  [customerId]: 0,
  [ownerId]: 0,
},

createdAt: serverTimestamp(),
  };

  if (serviceImage) {
    conversationData.serviceImage =
      serviceImage;
  }

  await setDoc(
    conversationReference,
    conversationData
  );

  return conversationReference.id;
}


export async function sendMessage(
  data: SendMessageData
): Promise<void>;

export async function sendMessage(
  conversationId: string,
  senderId: string,
  senderName: string,
  text: string
): Promise<void>;

export async function sendMessage(
  dataOrConversationId:
    | SendMessageData
    | string,
  oldSenderId?: string,
  oldSenderName?: string,
  oldText?: string
): Promise<void> {
  let messageData: SendMessageData;

 
  if (
    typeof dataOrConversationId ===
    "string"
  ) {
    messageData = {
      conversationId:
        dataOrConversationId,
      senderId: oldSenderId ?? "",
      senderName: oldSenderName ?? "",
      type: "text",
      text: oldText ?? "",
    };
  } else {
    messageData = dataOrConversationId;
  }

  const {
  conversationId,
  senderId,
  senderName,
  type,
  text,
  imageUrl,
  videoUrl,
  audioUrl,
  duration,

  documentUrl,
  documentName,
  documentSize,

  latitude,
  longitude,
  locationAddress,

  replyTo,
} = messageData;

  if (!conversationId) {
    throw new Error(
      "A conversa não foi encontrada."
    );
  }

  if (!senderId) {
    throw new Error(
      "O usuário não foi identificado."
    );
  }

  if (!senderName) {
    throw new Error(
      "O nome do usuário não foi informado."
    );
  }

  if (type === "text" && !text?.trim()) {
    throw new Error(
      "Digite uma mensagem."
    );
  }

 if (type === "image" && !imageUrl) {
    throw new Error(
      "A imagem não foi enviada."
    );
  }

  if (type === "video" && !videoUrl) {
    throw new Error(
      "O vídeo não foi enviado."
    );
  }

  if (type === "audio" && !audioUrl) {
    throw new Error(
      "O áudio não foi enviado."
    );
  }

  if (
  type === "location" &&
  (
    messageData.latitude === undefined ||
    messageData.longitude === undefined
  )
) {
  throw new Error(
    "A localização não foi obtida."
  );
}

  const conversationReference = doc(
    db,
    "conversations",
    conversationId
  );

  const messagesReference = collection(
    conversationReference,
    "messages"
  );

  let initialStatus: "sent" | "delivered" =
  "sent";

let recipientId = "";
let recipientIsInsideThisConversation = false;
let recipientPushTokens: string[] = [];

const conversationSnapshot =
  await getDoc(conversationReference);

if (conversationSnapshot.exists()) {
  const conversationData =
    conversationSnapshot.data();

  const participantIds =
    conversationData.participantIds as
      | string[]
      | undefined;

  recipientId =
  participantIds?.find(
    (participantId) =>
      participantId !== senderId
  ) ?? "";

  if (recipientId) {
    const recipientReference = doc(
      db,
      "users",
      recipientId
    );

    const recipientSnapshot =
      await getDoc(recipientReference);

    if (recipientSnapshot.exists()) {
  const recipientData =
    recipientSnapshot.data();

  if (recipientData.online === true) {
    initialStatus = "delivered";
  }

  recipientIsInsideThisConversation =
    recipientData.online === true &&
    recipientData.activeConversationId ===
      conversationId;

  if (
    Array.isArray(
      recipientData.expoPushTokens
    )
  ) {
    recipientPushTokens =
      recipientData.expoPushTokens.filter(
        (token: unknown) =>
          typeof token === "string"
      );
  }
}
  }
}

  const newMessage: Record<
  string,
  unknown
> = {
  conversationId,
  senderId,
  senderName,
  type,
  createdAt: serverTimestamp(),
  status: initialStatus,
};

if (replyTo) {
  newMessage.replyTo = replyTo;
}

  if (type === "text") {
    newMessage.text = text?.trim();
  }

 if (type === "image") {
    newMessage.imageUrl = imageUrl;

    if (text?.trim()) {
      newMessage.text = text.trim();
    }
  }

  if (type === "video") {
    newMessage.videoUrl = videoUrl;

    if (text?.trim()) {
      newMessage.text = text.trim();
    }
  }

  if (type === "audio") {
    newMessage.audioUrl = audioUrl;

    if (
      typeof duration === "number"
    ) {
      newMessage.duration = duration;
    }
  }

  if (type === "document") {
  newMessage.documentUrl = documentUrl;
  newMessage.documentName = documentName;
  newMessage.documentSize = documentSize;
}

if (type === "location") {
  newMessage.latitude = latitude;
  newMessage.longitude = longitude;
  newMessage.locationAddress = locationAddress;
}

  const createdMessageReference =
  await addDoc(
    messagesReference,
    newMessage
  );

  let lastMessage = "";

  if (type === "text") {
    lastMessage = text?.trim() ?? "";
  }

  if (type === "image") {
    lastMessage = "📷 Foto";
  }

  if (type === "video") {
    lastMessage = "🎥 Vídeo";
  }

  if (type === "audio") {
    lastMessage = "🎤 Áudio";
  }

  if (type === "document") {
  lastMessage = "📄 Documento";
  }

  if (type === "location") {
  lastMessage = "📍 Localização";
}

 const conversationUpdate: Record<
  string,
  unknown
> = {
  lastMessage,
  lastMessageId:
    createdMessageReference.id,
  lastMessageAt:
    serverTimestamp(),
};

if (
  recipientId &&
  !recipientIsInsideThisConversation
) {
  conversationUpdate[
    `unreadCounts.${recipientId}`
  ] = increment(1);
}

await updateDoc(
  conversationReference,
  conversationUpdate
);

if (
  recipientId &&
  !recipientIsInsideThisConversation &&
  recipientPushTokens.length > 0
) {
  await sendPushNotifications({
    tokens: recipientPushTokens,
    title: senderName,
    body: lastMessage || "Nova mensagem",
    data: {
      type: "chat",
      conversationId,
    },
  });
}
}

export async function deleteMessageForEveryone(
  conversationId: string,
  messageId: string,
  requesterId: string
): Promise<void> {
  if (!conversationId) {
    throw new Error(
      "Conversa não encontrada."
    );
  }

  if (!messageId) {
    throw new Error(
      "Mensagem não encontrada."
    );
  }

  if (!requesterId) {
    throw new Error(
      "Usuário não identificado."
    );
  }

  const conversationReference = doc(
    db,
    "conversations",
    conversationId
  );

  const messageReference = doc(
    db,
    "conversations",
    conversationId,
    "messages",
    messageId
  );

  const messageSnapshot =
    await getDoc(messageReference);

  if (!messageSnapshot.exists()) {
    throw new Error(
      "A mensagem não existe."
    );
  }

  

  const messageData =
    messageSnapshot.data();

  if (
    messageData.senderId !== requesterId
  ) {
    throw new Error(
      "Você só pode apagar para todos as mensagens que enviou."
    );
  }

  await updateDoc(messageReference, {
    deleted: true,
    deletedAt: serverTimestamp(),

    text: "",
    imageUrl: "",
    videoUrl: "",
    audioUrl: "",
    documentUrl: "",
documentName: "",
documentSize: null,

latitude: null,
longitude: null,
locationAddress: "",
  });

  const conversationSnapshot =
    await getDoc(conversationReference);

  if (!conversationSnapshot.exists()) {
    return;
  }

  const conversationData =
    conversationSnapshot.data();

  if (
    conversationData.lastMessageId ===
    messageId
  ) {
    await updateDoc(
      conversationReference,
      {
        lastMessage:
          "🚫 Mensagem apagada",
        lastMessageAt:
          serverTimestamp(),
      }
    );
  }
}

export async function deleteMessageForMe(
  conversationId: string,
  messageId: string,
  userId: string
): Promise<void> {
  if (!conversationId) {
    throw new Error(
      "Conversa não encontrada."
    );
  }

  if (!messageId) {
    throw new Error(
      "Mensagem não encontrada."
    );
  }

  if (!userId) {
    throw new Error(
      "Usuário não identificado."
    );
  }

  const messageReference = doc(
    db,
    "conversations",
    conversationId,
    "messages",
    messageId
  );

  await updateDoc(messageReference, {
    hiddenFor: arrayUnion(userId),
  });
}

export async function markMessagesAsDelivered(
  conversationId: string,
  userId: string
): Promise<void> {
  if (!conversationId || !userId) {
    return;
  }

  const messagesReference = collection(
    db,
    "conversations",
    conversationId,
    "messages"
  );

  const messagesSnapshot = await getDocs(
    messagesReference
  );

  const updates = messagesSnapshot.docs.map(
    async (messageDocument) => {
      const messageData =
        messageDocument.data();

      const isReceivedMessage =
        messageData.senderId !== userId;

      const canBeMarkedAsRead =
        messageData.status === "sent" ||
        messageData.status === "delivered";

      const isDeleted =
        messageData.deleted === true;

      if (
        isReceivedMessage &&
        canBeMarkedAsRead &&
        !isDeleted
      ) {
        await updateDoc(
          messageDocument.ref,
          {
            status: "read",
            readAt: serverTimestamp(),
          }
        );
      }
    }
  );

  await Promise.all(updates);

  await updateDoc(
  doc(db, "conversations", conversationId),
  {
    [`unreadCounts.${userId}`]: 0,
  }
);
}

export async function hideConversation(
  conversationId: string,
  userId: string
) {
  if (!conversationId || !userId) {
    return;
  }

  await updateDoc(
    doc(db, "conversations", conversationId),
    {
      hiddenFor: arrayUnion(userId),
    }
  );
}
export async function setTyping(
  conversationId: string,
  userId: string,
  typing: boolean
) {
  if (!conversationId || !userId) {
    return;
  }

  await updateDoc(
    doc(db, "conversations", conversationId),
    {
      [`typing.${userId}`]: typing,
    }
  );
}

export function listenTyping(
  conversationId: string,
  callback: (typing: Record<string, boolean>) => void
): Unsubscribe {

  return onSnapshot(
    doc(db, "conversations", conversationId),
    (snapshot) => {

      if (!snapshot.exists()) {
        callback({});
        return;
      }

      const data = snapshot.data();

      callback(data.typing ?? {});
    }
  );
}


