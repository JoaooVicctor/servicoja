import { db } from "@/src/services/firebase";

import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

export type ReportType =
  | "user"
  | "service";

export interface CreateReportData {
  reporterId: string;
  reportedUserId: string;

  type: ReportType;

  serviceId?: string;
  reason: string;
  description?: string;
}

export async function createReport(
  data: CreateReportData
): Promise<void> {
  if (!data.reporterId) {
    throw new Error(
      "Usuário não identificado."
    );
  }

  if (!data.reportedUserId) {
    throw new Error(
      "Usuário denunciado não identificado."
    );
  }

  if (
    data.reporterId ===
    data.reportedUserId
  ) {
    throw new Error(
      "Você não pode denunciar a si mesmo."
    );
  }

  if (!data.reason.trim()) {
    throw new Error(
      "Selecione um motivo para a denúncia."
    );
  }

  await addDoc(
    collection(db, "reports"),
    {
      reporterId:
        data.reporterId,

      reportedUserId:
        data.reportedUserId,

      type: data.type,

      serviceId:
        data.serviceId ?? null,

      reason:
        data.reason.trim(),

      description:
        data.description?.trim() || null,

      status: "pending",

      createdAt:
        serverTimestamp(),
    }
  );
}