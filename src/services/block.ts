import { db } from "@/src/services/firebase";

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc
} from "firebase/firestore";

/**
 * Bloqueia um usuário.
 *
 * O bloqueio é salvo de forma independente
 * para cada usuário.
 *
 * Exemplo:
 *
 * users/{meuId}/blockedUsers/{usuarioBloqueadoId}
 */

export async function blockUser(
  blockerId: string,
  blockedUserId: string
): Promise<void> {
  if (!blockerId) {
    throw new Error(
      "Usuário não identificado."
    );
  }

  if (!blockedUserId) {
    throw new Error(
      "Usuário a ser bloqueado não identificado."
    );
  }

  if (blockerId === blockedUserId) {
    throw new Error(
      "Você não pode bloquear a si mesmo."
    );
  }

  await setDoc(
    doc(
      db,
      "users",
      blockerId,
      "blockedUsers",
      blockedUserId
    ),
    {
      blockedUserId,
      createdAt: new Date().toISOString(),
    }
  );
}

/**
 * Desbloqueia um usuário.
 */
export async function unblockUser(
  blockerId: string,
  blockedUserId: string
): Promise<void> {
  if (!blockerId || !blockedUserId) {
    throw new Error(
      "Usuário não identificado."
    );
  }

  await deleteDoc(
    doc(
      db,
      "users",
      blockerId,
      "blockedUsers",
      blockedUserId
    )
  );
}

/**
 * Verifica se o usuário A bloqueou o usuário B.
 */
export async function hasBlockedUser(
  blockerId: string,
  blockedUserId: string
): Promise<boolean> {
  if (!blockerId || !blockedUserId) {
    return false;
  }

  const blockedRef = doc(
    db,
    "users",
    blockerId,
    "blockedUsers",
    blockedUserId
  );

  const snapshot =
    await getDoc(blockedRef);

  return snapshot.exists();
}

/**
 * Verifica o bloqueio nos dois sentidos.
 *
 * Retorna:
 *
 * blockedByMe:
 * Eu bloqueei a outra pessoa.
 *
 * blockedMe:
 * A outra pessoa me bloqueou.
 */
export async function getBlockStatus(
  currentUserId: string,
  otherUserId: string
): Promise<{
  blockedByMe: boolean;
  blockedMe: boolean;
}> {
  if (
    !currentUserId ||
    !otherUserId
  ) {
    return {
      blockedByMe: false,
      blockedMe: false,
    };
  }

  if (
    currentUserId === otherUserId
  ) {
    return {
      blockedByMe: false,
      blockedMe: false,
    };
  }

  const [
    blockedByMe,
    blockedMe,
  ] = await Promise.all([
    hasBlockedUser(
      currentUserId,
      otherUserId
    ),

    hasBlockedUser(
      otherUserId,
      currentUserId
    ),
  ]);

  return {
    blockedByMe,
    blockedMe,
  };
}

/**
 * Retorna todos os IDs de usuários
 * bloqueados pelo usuário atual.
 */
export async function getBlockedUsers(
  userId: string
): Promise<string[]> {
  if (!userId) {
    return [];
  }

  const snapshot = await getDocs(
    collection(
      db,
      "users",
      userId,
      "blockedUsers"
    )
  );

  return snapshot.docs.map(
    (blockedDoc) =>
      blockedDoc.id
  );
}