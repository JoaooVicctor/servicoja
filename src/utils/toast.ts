import Toast from "react-native-toast-message";

export function showSuccess(
  title: string,
  message?: string
) {
  Toast.show({
    type: "success",
    text1: title,
    text2: message,
    visibilityTime: 2500,
    position: "top",
  });
}

export function showError(
  title: string,
  message?: string
) {
  Toast.show({
    type: "error",
    text1: title,
    text2: message,
    visibilityTime: 3000,
    position: "top",
  });
}

export function showInfo(
  title: string,
  message?: string
) {
  Toast.show({
    type: "info",
    text1: title,
    text2: message,
    visibilityTime: 2500,
    position: "top",
  });
}