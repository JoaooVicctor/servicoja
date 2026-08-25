import { Service } from "@/src/types/Service";

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { uploadImage } from "@/src/services/cloudinary";

import { db } from "@/src/services/firebase";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

interface CreateServiceData {
  userId: string;
  userName: string;
  userPhoto?: string;

  images: string[];
  category: string;
  price: string;
  title: string;
  description: string;
  city: string;
  neighborhood: string;
  whatsapp: string;
  attendance: Service["attendance"];
}

interface UpdateServiceData {
  images: string[];
  category: string;
  price: string;
  title: string;
  description: string;
  city: string;
  neighborhood: string;
  whatsapp: string;
  attendance: Service["attendance"];
}

interface UpdateUserServicesData {
  userId: string;
  userName: string;
  userPhoto?: string;
}

interface ServiceContextData {
  services: Service[];

  createService: (
    data: CreateServiceData
  ) => Promise<Service>;

  updateService: (
    serviceId: string,
    data: UpdateServiceData
  ) => Promise<Service>;

  deleteService: (
    serviceId: string
  ) => Promise<void>;

  getServiceById: (
    serviceId: string
  ) => Service | undefined;

  updateUserServices: (
    data: UpdateUserServicesData
  ) => Promise<void>;

  loadServices: () => Promise<void>;
}

interface ServiceProviderProps {
  children: ReactNode;
}

const SERVICES_STORAGE_KEY =
  "@servicoja:services";

const ServiceContext =
  createContext<ServiceContextData | undefined>(
    undefined
  );

export function ServiceProvider({
  children,
}: ServiceProviderProps) {
  const [services, setServices] =
    useState<Service[]>([]);

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    try {
      const snapshot = await getDocs(
        collection(db, "services")
      );

      const loadedServices: Service[] =
        snapshot.docs.map((serviceDoc) => ({
          id: serviceDoc.id,
          ...(serviceDoc.data() as Omit<
            Service,
            "id"
          >),
        }));

      setServices(loadedServices);

      await AsyncStorage.setItem(
        SERVICES_STORAGE_KEY,
        JSON.stringify(loadedServices)
      );
    } catch (error) {
      console.log(
        "Erro ao carregar serviços:",
        error
      );
    }
  }

  function validateImages(images: string[]) {
    if (images.length < 1) {
      throw new Error(
        "Adicione pelo menos uma foto."
      );
    }

    if (images.length > 5) {
      throw new Error(
        "Você pode adicionar no máximo cinco fotos."
      );
    }
  }

  async function createService(
    data: CreateServiceData
  ): Promise<Service> {
    try {
      validateImages(data.images);

      const uploadedImages =
        await Promise.all(
          data.images.map((image) =>
            uploadImage(image)
          )
        );

      const serviceData = {
        ...data,
        images: uploadedImages,
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(
        collection(db, "services"),
        serviceData
      );

      const newService: Service = {
        id: docRef.id,
        ...serviceData,
      };

      setServices((oldServices) => [
        newService,
        ...oldServices,
      ]);

      return newService;
    } catch (error) {
      console.log(
        "Erro ao publicar serviço:",
        error
      );

      throw error;
    }
  }

  async function updateService(
    serviceId: string,
    data: UpdateServiceData
  ): Promise<Service> {
    validateImages(data.images);

    const serviceToUpdate =
      services.find(
        (service) =>
          service.id === serviceId
      );

    if (!serviceToUpdate) {
      throw new Error(
        "Serviço não encontrado."
      );
    }

    await updateDoc(
      doc(db, "services", serviceId),
      {
        ...data,
      }
    );

    const updatedService: Service = {
      ...serviceToUpdate,
      ...data,
    };

    setServices((oldServices) =>
      oldServices.map((service) =>
        service.id === serviceId
          ? updatedService
          : service
      )
    );

    return updatedService;
  }

  async function deleteService(
    serviceId: string
  ): Promise<void> {
    await deleteDoc(
      doc(db, "services", serviceId)
    );

    setServices((oldServices) =>
      oldServices.filter(
        (service) =>
          service.id !== serviceId
      )
    );
  }

  async function updateUserServices({
    userId,
    userName,
    userPhoto,
  }: UpdateUserServicesData): Promise<void> {
    try {
      console.log(
        "Atualizando anúncios do usuário:",
        userId
      );

      console.log(
        "Nova foto:",
        userPhoto
      );

      const servicesQuery = query(
        collection(db, "services"),
        where("userId", "==", userId)
      );

      const snapshot = await getDocs(
        servicesQuery
      );

      console.log(
        "Quantidade de anúncios encontrados:",
        snapshot.docs.length
      );

      await Promise.all(
        snapshot.docs.map(
          async (serviceDoc) => {
            await updateDoc(
              doc(
                db,
                "services",
                serviceDoc.id
              ),
              {
                userName,
                userPhoto: userPhoto || null,
              }
            );
          }
        )
      );

      // Atualiza imediatamente os anúncios
      // que estão carregados no app
      setServices((currentServices) =>
        currentServices.map((service) => {
          if (service.userId === userId) {
            return {
              ...service,
              userName,
              userPhoto,
            };
          }

          return service;
        })
      );

      // Recarrega todos os anúncios diretamente
      // do Firestore para garantir que a nova foto
      // apareça em todas as telas
      await loadServices();

      console.log(
        "Todos os anúncios foram atualizados."
      );
    } catch (error) {
      console.log(
        "Erro ao atualizar anúncios do usuário:",
        error
      );

      throw error;
    }
  }

  function getServiceById(
    serviceId: string
  ) {
    return services.find(
      (service) =>
        service.id === serviceId
    );
  }

  return (
    <ServiceContext.Provider
      value={{
        services,
        createService,
        updateService,
        deleteService,
        getServiceById,
        updateUserServices,
        loadServices,
      }}
    >
      {children}
    </ServiceContext.Provider>
  );
}

export function useServices() {
  const context = useContext(
    ServiceContext
  );

  if (!context) {
    throw new Error(
      "useServices deve ser usado dentro de um ServiceProvider."
    );
  }

  return context;
}