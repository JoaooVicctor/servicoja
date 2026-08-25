import { uploadImage } from "./cloudinary";

import { db } from "./firebase";

import {
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

import { User } from "../types/user";

export async function updateProfilePhoto(
  userId: string,
  imageUri: string
): Promise<User> {
  console.log(
    "Iniciando atualização da foto..."
  );

  const photoURL = await uploadImage(
    imageUri
  );

  console.log(
    "Nova URL da foto:",
    photoURL
  );

  const userRef = doc(
    db,
    "users",
    userId
  );

  await updateDoc(userRef, {
    photoURL,
  });

  console.log(
    "Foto atualizada no Firestore."
  );

  const snapshot = await getDoc(
    userRef
  );

  if (!snapshot.exists()) {
    throw new Error(
      "Usuário não encontrado."
    );
  }

  const updatedUser: User = {
    id: userId,
    ...(snapshot.data() as Omit<
      User,
      "id"
    >),
  };

  console.log(
    "Usuário retornado:",
    updatedUser
  );

  return updatedUser;
}