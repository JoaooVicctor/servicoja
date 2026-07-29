import { uploadImage } from "./cloudinary";
import { auth, db } from "./firebase";

import { doc, getDoc, updateDoc } from "firebase/firestore";
import { User } from "../types/user";

export async function updateProfilePhoto(
  imageUri: string
): Promise<User> {
  console.log("auth.currentUser:", auth.currentUser);
  if (!auth.currentUser) {
    throw new Error("Usuário não autenticado.");
  }

  const photoURL = await uploadImage(imageUri);

  const userRef = doc(db, "users", auth.currentUser.uid);

  await updateDoc(userRef, {
    photoURL,
  });

  const snapshot = await getDoc(userRef);

  return {
    id: auth.currentUser.uid,
    ...(snapshot.data() as Omit<User, "id">),
  };
}