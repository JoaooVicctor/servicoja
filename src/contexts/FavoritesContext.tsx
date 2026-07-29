import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const FAVORITES_STORAGE_KEY =
  "@servicoja:favorites";

interface FavoritesContextData {
  favorites: string[];

  addFavorite: (
    serviceId: string
  ) => Promise<void>;

  removeFavorite: (
    serviceId: string
  ) => Promise<void>;

  toggleFavorite: (
    serviceId: string
  ) => Promise<void>;

  isFavorite: (
    serviceId: string
  ) => boolean;
}

const FavoritesContext =
  createContext<FavoritesContextData>(
    {} as FavoritesContextData
  );

interface FavoritesProviderProps {
  children: ReactNode;
}

export function FavoritesProvider({
  children,
}: FavoritesProviderProps) {
  const [favorites, setFavorites] = useState<
    string[]
  >([]);

  useEffect(() => {
    loadFavorites();
  }, []);

  async function loadFavorites() {
    try {
      const storedFavorites =
        await AsyncStorage.getItem(
          FAVORITES_STORAGE_KEY
        );

      if (!storedFavorites) {
        return;
      }

      const parsedFavorites: string[] =
        JSON.parse(storedFavorites);

      setFavorites(parsedFavorites);
    } catch (error) {
      console.log(
        "Erro ao carregar favoritos:",
        error
      );
    }
  }

  async function saveFavorites(
    updatedFavorites: string[]
  ) {
    try {
      await AsyncStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(updatedFavorites)
      );
    } catch (error) {
      console.log(
        "Erro ao salvar favoritos:",
        error
      );
    }
  }

  async function addFavorite(
    serviceId: string
  ) {
    if (favorites.includes(serviceId)) {
      return;
    }

    const updatedFavorites = [
      ...favorites,
      serviceId,
    ];

    setFavorites(updatedFavorites);

    await saveFavorites(updatedFavorites);
  }

  async function removeFavorite(
    serviceId: string
  ) {
    const updatedFavorites =
      favorites.filter(
        (favoriteId) =>
          favoriteId !== serviceId
      );

    setFavorites(updatedFavorites);

    await saveFavorites(updatedFavorites);
  }

  async function toggleFavorite(
    serviceId: string
  ) {
    if (favorites.includes(serviceId)) {
      await removeFavorite(serviceId);
      return;
    }

    await addFavorite(serviceId);
  }

  function isFavorite(
    serviceId: string
  ) {
    return favorites.includes(serviceId);
  }

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        isFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context =
    useContext(FavoritesContext);

  if (!context) {
    throw new Error(
      "useFavorites deve ser usado dentro de FavoritesProvider"
    );
  }

  return context;
}