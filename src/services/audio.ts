import { Platform } from "react-native";

const CLOUD_NAME = "qdmcxuce";
const UPLOAD_PRESET = "servicoja";

export async function uploadAudio(
  audioUri: string
): Promise<string> {
  const formData = new FormData();

  if (Platform.OS === "web") {
    const response = await fetch(audioUri);
    const blob = await response.blob();

    formData.append(
      "file",
      blob,
      `audio-${Date.now()}.m4a`
    );
  } else {
    const fileName =
      audioUri.split("/").pop() ??
      `audio-${Date.now()}.m4a`;

    formData.append(
      "file",
      {
        uri: audioUri,
        name: fileName,
        type: "audio/m4a",
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
        "Erro ao enviar áudio."
    );
  }

  return result.secure_url;
}