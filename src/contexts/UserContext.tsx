import { hideAllUserConversations } from "@/src/services/chat";
import { auth, db } from "@/src/services/firebase";

import {
  getUser,
  removeUser,
  saveUser,
} from "@/src/storage/userStorage";

import { User } from "@/src/types/user";

import {
  deleteUser as deleteAuthUser,
  EmailAuthProvider,
  User as FirebaseUser, // NOVO
  reauthenticateWithCredential,
  signOut,
} from "firebase/auth";

import {
  collection,
  deleteDoc,
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

  setUser: (
    user: User
  ) => Promise<void>;

  logout: () => Promise<void>;

  deleteAccount: (
    authenticatedUser: FirebaseUser,
    password: string
  ) => Promise<void>;
}

const UserContext =
  createContext<UserContextData>(
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
        where(
          "userId",
          "==",
          updatedUser.id
        )
      );

      const snapshot =
        await getDocs(servicesQuery);

      const updatePromises =
        snapshot.docs.map(
          (serviceDoc) =>
            updateDoc(
              doc(
                db,
                "services",
                serviceDoc.id
              ),
              {
                userName:
                  updatedUser.name,

                userPhoto:
                  updatedUser.photoURL ??
                  null,
              }
            )
        );

      await Promise.all(
        updatePromises
      );

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

    await updateUserServices(
      updatedUser
    );
  }

  async function logout() {
    await signOut(auth);

    setUserState(null);

    await removeUser();
  }

  async function deleteAccount(
    authenticatedUser: FirebaseUser,
    password: string
  ): Promise<void> {
    const userId =
      authenticatedUser.uid;

    try {
      console.log(
        "Iniciando exclusão da conta:",
        userId
      );

      // 0. Reautentica o usuário com a senha
      // antes de fazer qualquer exclusão
      if (authenticatedUser.email) {
        const credential =
          EmailAuthProvider.credential(
            authenticatedUser.email,
            password
          );

        await reauthenticateWithCredential(
          authenticatedUser,
          credential
        );
      }

      // 1. Esconder todas as conversas
      // somente para este usuário
      await hideAllUserConversations(
        userId
      );

      // 2. Buscar todos os serviços
      // pertencentes ao usuário
      const servicesQuery = query(
        collection(db, "services"),
        where(
          "userId",
          "==",
          userId
        )
      );

      const servicesSnapshot =
        await getDocs(
          servicesQuery
        );

      console.log(
        "Serviços encontrados:",
        servicesSnapshot.docs.length
      );

      // 3. Apagar todos os serviços
      await Promise.all(
        servicesSnapshot.docs.map(
          (serviceDoc) =>
            deleteDoc(
              doc(
                db,
                "services",
                serviceDoc.id
              )
            )
        )
      );

      // 4. Apagar documento do usuário
      await deleteDoc(
        doc(
          db,
          "users",
          userId
        )
      );

      // 5. Apagar conta do Firebase Authentication
      await deleteAuthUser(
        authenticatedUser
      );

      // 6. Limpar dados locais
      setUserState(null);

      await removeUser();

      console.log(
        "Conta excluída com sucesso."
      );
    } catch (error) {
      console.log(
        "Erro ao excluir conta:",
        error
      );

      throw error;
    }
  }

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        logout,
        deleteAccount,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
