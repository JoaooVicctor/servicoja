import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "../types/user";

const USER_KEY = "@servicoja:user";

export async function saveUser(user: User) {
  await AsyncStorage.setItem(
    USER_KEY,
    JSON.stringify(user)
  );
}

export async function getUser() {
  const data = await AsyncStorage.getItem(USER_KEY);

  if (!data) {
    return null;
  }

  return JSON.parse(data) as User;
}

export async function removeUser() {
  await AsyncStorage.removeItem(USER_KEY);
}