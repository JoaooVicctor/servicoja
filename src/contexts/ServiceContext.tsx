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
  updateDoc,
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
  const [services, setServices] = useState<
    Service[]
  >([]);

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
  try {
    const snapshot = await getDocs(
      collection(db, "services")
    );

    const loadedServices: Service[] =
      snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Service, "id">),
      }));

    setServices(loadedServices);
  } catch (error) {
    console.log(
      "Erro ao carregar serviços:",
      error
    );
  }
}

  async function saveServices(
    updatedServices: Service[]
  ) {
    setServices(updatedServices);

    await AsyncStorage.setItem(
      SERVICES_STORAGE_KEY,
      JSON.stringify(updatedServices)
    );
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
    console.log(
      "Iniciando publicação do serviço"
    );

    validateImages(data.images);

    console.log(
      "Imagens selecionadas:",
      data.images
    );

    const uploadedImages =
      await Promise.all(
        data.images.map((image) =>
          uploadImage(image)
        )
      );

    console.log(
      "Imagens enviadas:",
      uploadedImages
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

    setServices((old) => [
      newService,
      ...old,
    ]);

    console.log(
      "Serviço publicado com sucesso"
    );

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

  const serviceToUpdate = services.find(
    (service) => service.id === serviceId
  );

  if (!serviceToUpdate) {
    throw new Error("Serviço não encontrado.");
  }

  await updateDoc(doc(db, "services", serviceId), {
    ...data,
  });

  const updatedService: Service = {
    ...serviceToUpdate,
    ...data,
  };

  setServices((old) =>
    old.map((service) =>
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
      (service) => service.id !== serviceId
    )
  );
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