import { Platform } from "react-native";

const CLOUD_NAME = "qdmcxuce";
const UPLOAD_PRESET = "servicoja";

export async function uploadVideo(
  uri: string
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

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result?.error?.message ??
      "Erro ao enviar vídeo."
    );
  }

  return result.secure_url;
}