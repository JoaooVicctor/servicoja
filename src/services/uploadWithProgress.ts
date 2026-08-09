export function uploadFormDataWithProgress(
  url: string,
  formData: FormData,
  onProgress?: (percent: number) => void
): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("POST", url);

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round(
            (event.loaded / event.total) * 100
          );

          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      try {
        const result = JSON.parse(xhr.responseText);

        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(result);
        } else {
          reject(
            new Error(
              result?.error?.message ??
                "Erro ao enviar arquivo."
            )
          );
        }
      } catch {
        reject(
          new Error("Resposta inválida do servidor.")
        );
      }
    };

    xhr.onerror = () => {
      reject(
        new Error(
          "Falha de conexão. Verifique sua internet."
        )
      );
    };

    xhr.send(formData);
  });
}