import { uploadImage } from "./cloudinary";
import { db } from "./firebase";

import { doc, getDoc, updateDoc } from "firebase/firestore";
import { User } from "../types/user";

export async function updateProfilePhoto(
  userId: string,
  imageUri: string
): Promise<User> {
  const photoURL = await uploadImage(imageUri);

  const userRef = doc(db, "users", userId);

  await updateDoc(userRef, {
    photoURL,
  });

  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    throw new Error("Usuário não encontrado.");
  }

  return {
    id: userId,
    ...(snapshot.data() as Omit<User, "id">),
  };
}