import { db } from "@/src/services/firebase";
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

export async function setUserOnline(userId: string) {
  if (!userId) return;

  await updateDoc(doc(db, "users", userId), {
    online: true,
    lastSeen: serverTimestamp(),
  });
}

export async function setUserOffline(userId: string) {
  if (!userId) return;

  await updateDoc(doc(db, "users", userId), {
    online: false,
    lastSeen: serverTimestamp(),
  });
}

export async function updatePendingMessages(
  userId: string
) {
  const conversations = await getDocs(
    query(
      collection(db, "conversations"),
      where("participantIds", "array-contains", userId)
    )
  );

  for (const conversation of conversations.docs) {
    const messages = await getDocs(
      collection(
        db,
        "conversations",
        conversation.id,
        "messages"
      )
    );

    for (const message of messages.docs) {
      const data = message.data();

      if (
        data.senderId !== userId &&
        data.status === "sent" &&
        !data.deleted
      ) {
        await updateDoc(message.ref, {
          status: "delivered",
        });
      }
    }
  }
}