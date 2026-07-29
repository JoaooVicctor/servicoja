import { Platform } from "react-native";

const CLOUD_NAME = "qdmcxuce";
const UPLOAD_PRESET = "servicoja";

export async function uploadImage(
  imageUri: string
): Promise<string> {
  console.log(
    "Cloudinary: iniciando upload",
    imageUri
  );

  const formData = new FormData();

  if (Platform.OS === "web") {
    const imageResponse = await fetch(imageUri);

    if (!imageResponse.ok) {
      throw new Error(
        "Não foi possível preparar a imagem selecionada."
      );
    }

    const imageBlob = await imageResponse.blob();

    formData.append(
      "file",
      imageBlob,
      `imagem-${Date.now()}.jpg`
    );
  } else {
    const fileName =
      imageUri.split("/").pop() ??
      `imagem-${Date.now()}.jpg`;

    const extension = fileName
      .split(".")
      .pop()
      ?.toLowerCase();

    let mimeType = "image/jpeg";

    switch (extension) {
      case "png":
        mimeType = "image/png";
        break;

      case "webp":
        mimeType = "image/webp";
        break;

      case "gif":
        mimeType = "image/gif";
        break;
    }

    formData.append(
      "file",
      {
        uri: imageUri,
        name: fileName,
        type: mimeType,
      } as any
    );
  }

  formData.append(
    "upload_preset",
    UPLOAD_PRESET
  );

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const result = await response.json();

  console.log(
    "Cloudinary: resposta",
    result
  );

  if (!response.ok) {
    throw new Error(
      result?.error?.message ??
        "Erro ao enviar imagem para o Cloudinary."
    );
  }

  if (!result.secure_url) {
    throw new Error(
      "O Cloudinary não retornou a URL da imagem."
    );
  }

  console.log(
    "Cloudinary: upload concluído",
    result.secure_url
  );

  return result.secure_url;
}