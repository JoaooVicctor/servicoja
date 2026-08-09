import { Platform } from "react-native";
import { uploadFormDataWithProgress } from "./uploadWithProgress";

const CLOUD_NAME = "qdmcxuce";
const UPLOAD_PRESET = "servicoja";

export async function uploadVideo(
  uri: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  const formData = new FormData();

  if (Platform.OS === "web") {
    const response = await fetch(uri);

    if (!response.ok) {
      throw new Error(
        "Não foi possível preparar o vídeo."
      );
    }

    const blob = await response.blob();

    formData.append(
      "file",
      blob,
      "video.mp4"
    );
  } else {
    formData.append(
      "file",
      {
        uri,
        type: "video/mp4",
        name: "video.mp4",
      } as any
    );
  }

  formData.append(
    "upload_preset",
    UPLOAD_PRESET
  );

  const result = await uploadFormDataWithProgress(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`,
    formData,
    onProgress
  );

  return result.secure_url;
}