import { auth } from "@/src/services/firebase";
import {
  getUser,
  removeUser,
  saveUser,
} from "@/src/storage/userStorage";
import { User } from "@/src/types/user";
import { signOut } from "firebase/auth";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";



interface UserContextData {

  user: User | null;

  setUser: (user: User) => void;

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


  const [user, setUserState] = useState<User | null>(null);



  useEffect(() => {

    async function loadUser(){

      const savedUser = await getUser();


      if(savedUser){

        setUserState(savedUser);

      }

    }


    loadUser();

  }, []);





  async function setUser(user: User){

    setUserState(user);

    await saveUser(user);

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





export function useUser(){

  return useContext(UserContext);

}