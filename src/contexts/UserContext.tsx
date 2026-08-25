import { auth, db } from "@/src/services/firebase";

import {
  getUser,
  removeUser,
  saveUser,
} from "@/src/storage/userStorage";

import { User } from "@/src/types/user";

import { signOut } from "firebase/auth";

import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface UserContextData {
  user: User | null;
  setUser: (user: User) => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextData>(
  {} as UserContextData
);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({
  children,
}: UserProviderProps) {
  const [user, setUserState] =
    useState<User | null>(null);

  useEffect(() => {
    async function loadUser() {
      const savedUser = await getUser();

      if (savedUser) {
        setUserState(savedUser);
      }
    }

    loadUser();
  }, []);

  async function updateUserServices(
    updatedUser: User
  ) {
    try {
      const servicesQuery = query(
        collection(db, "services"),
        where("userId", "==", updatedUser.id)
      );

      const snapshot = await getDocs(
        servicesQuery
      );

      const updatePromises = snapshot.docs.map(
        (serviceDoc) =>
          updateDoc(
            doc(db, "services", serviceDoc.id),
            {
              userName: updatedUser.name,
              userPhoto: updatedUser.photoURL ?? null,
            }
          )
      );

      await Promise.all(updatePromises);

      console.log(
        "Serviços do usuário atualizados com sucesso."
      );
    } catch (error) {
      console.log(
        "Erro ao atualizar serviços do usuário:",
        error
      );
    }
  }

  async function setUser(
    updatedUser: User
  ): Promise<void> {
    setUserState(updatedUser);

    await saveUser(updatedUser);

    await updateUserServices(updatedUser);
  }

  async function logout() {
    await signOut(auth);

    setUserState(null);

    await removeUser();
  }

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}