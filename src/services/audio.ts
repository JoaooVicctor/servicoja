import { Platform } from "react-native";
import { uploadFormDataWithProgress } from "./uploadWithProgress";

const CLOUD_NAME = "qdmcxuce";
const UPLOAD_PRESET = "servicoja";

export async function uploadAudio(
  audioUri: string,
  onProgress?: (percent: number) => void
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

  const result = await uploadFormDataWithProgress(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`,
    formData,
    onProgress
  );

  return result.secure_url;
}