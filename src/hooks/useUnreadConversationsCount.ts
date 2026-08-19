import { useUser } from "@/src/contexts/UserContext";
import { db } from "@/src/services/firebase";

import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import { useEffect, useState } from "react";

export function useUnreadConversationsCount() {
  const { user } = useUser();

  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user?.id) {
      setCount(0);
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
        let total = 0;

        snapshot.docs.forEach((document) => {
          const data = document.data();

          const hiddenFor = Array.isArray(
            data.hiddenFor
          )
            ? data.hiddenFor
            : [];

          if (hiddenFor.includes(user.id)) {
            return;
          }

          const unreadCount =
            data.unreadCounts?.[user.id] ?? 0;

          total += unreadCount;
        });

        setCount(total);
      },
      (error) => {
        console.log(
          "Erro ao contar mensagens não lidas:",
          error
        );

        setCount(0);
      }
    );

    return unsubscribe;
  }, [user?.id]);

  return count;
}