import { Platform } from "react-native";
import { uploadFormDataWithProgress } from "./uploadWithProgress";

const CLOUD_NAME = "qdmcxuce";
const UPLOAD_PRESET = "servicoja";

export async function uploadDocument(
  uri: string,
  fileName: string,
  mimeType: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  const formData = new FormData();

  if (Platform.OS === "web") {
    const response = await fetch(uri);

    if (!response.ok) {
      throw new Error(
        "Não foi possível preparar o documento."
      );
    }

    const blob = await response.blob();

    formData.append(
      "file",
      blob,
      fileName
    );
  } else {
    formData.append(
      "file",
      {
        uri,
        name: fileName,
        type: mimeType,
      } as any
    );
  }

 formData.append(
    "upload_preset",
    UPLOAD_PRESET
  );

  const result = await uploadFormDataWithProgress(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`,
    formData,
    onProgress
  );

  if (!result.secure_url) {
    throw new Error(
      "Cloudinary não retornou a URL."
    );
  }

  return result.secure_url;
}