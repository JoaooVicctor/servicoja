import { Timestamp } from "firebase/firestore";

export type MessageType =
  | "text"
  | "image"
  | "audio"
  | "document"
  | "location";

export interface Conversation {
  id: string;

  serviceId: string;
  serviceTitle: string;
  serviceImage?: string;

  participantIds: string[];

  customerId: string;
  customerName: string;

  ownerId: string;
  ownerName: string;

  hiddenFor?: string[];

  lastMessage: string;
  lastMessageId?: string;
  lastMessageAt: any;

  createdAt: any;
}

export interface ReplyMessage {
  id: string;

  senderId: string;
  senderName: string;

  type: MessageType;

  text?: string;
  imageUrl?: string;
  audioUrl?: string;

  documentUrl?: string;
  documentName?: string;

  latitude?: number;
  longitude?: number;
  locationAddress?: string;
    
  }

export interface ChatMessage {
  id: string;

  conversationId: string;

  senderId: string;
  senderName: string;

  type: MessageType;

  text?: string;
  imageUrl?: string;
  audioUrl?: string;
  documentUrl?: string;

  documentName?: string;

  documentSize?: number;

  duration?: number;
  latitude?: number;
  longitude?: number;
  locationAddress?: string;

  replyTo?: ReplyMessage;

  createdAt: any;

  status?: "sent" | "delivered" | "read";
  readAt?: Timestamp;

  deleted?: boolean;
  deletedAt?: Timestamp;

  hiddenFor?: string[];
  hiddenForMe?: boolean;
}