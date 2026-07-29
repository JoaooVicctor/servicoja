export type ServiceAttendance =
  | "local"
  | "domicilio"
  | "online";

export interface Service {
  id: string;

  userId: string;
  userName: string;

  images: string[];

  title: string;
  description: string;
  category: string;
  price: string;

  city: string;
  neighborhood: string;
  whatsapp: string;

  attendance: (
    | "local"
    | "domicilio"
    | "online"
  )[];

  createdAt: string;
}