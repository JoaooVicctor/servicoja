import { useUser } from "@/src/contexts/UserContext";
import { auth } from "@/src/services/firebase";
import { showError, showSuccess } from "@/src/utils/toast";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  updatePassword,
} from "firebase/auth";
import { useState } from "react";

import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ChangePassword() {
  const { user } = useUser();

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  async function handleChangePassword() {
    if (!user?.email) {
      showError(
        "Erro",
        "Não foi possível identificar o e-mail da sua conta."
      );
      return;
    }

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      showError(
        "Preencha todos os campos",
        "Informe sua senha atual e a nova senha."
      );
      return;
    }

    if (newPassword.length < 6) {
      showError(
        "Senha muito curta",
        "A nova senha deve ter pelo menos 6 caracteres."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      showError(
        "As senhas não coincidem",
        "Digite a mesma nova senha nos dois campos."
      );
      return;
    }

    try {
      setLoading(true);

      // Faz login novamente com a senha atual
      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          user.email,
          currentPassword
        );

      const currentUser =
        userCredential.user;

      // Confirma novamente a senha atual
      const credential =
        EmailAuthProvider.credential(
          user.email,
          currentPassword
        );

      await reauthenticateWithCredential(
        currentUser,
        credential
      );

      // Altera para a nova senha
      await updatePassword(
        currentUser,
        newPassword
      );

      showSuccess(
        "Senha alterada",
        "Sua senha foi alterada com sucesso."
      );

      router.back();
    } catch (error: any) {
      console.log(
        "Erro ao alterar senha:",
        error
      );

      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-login-credentials"
      ) {
        showError(
          "Senha incorreta",
          "A senha atual informada está incorreta."
        );
      } else {
        showError(
          "Erro",
          "Não foi possível alterar sua senha. Tente novamente."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={25}
            color="#222"
          />
        </TouchableOpacity>

        <Text style={styles.title}>
          Alterar senha
        </Text>

        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>
          Para sua segurança, informe sua senha atual
          antes de criar uma nova senha.
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Senha atual
          </Text>

          <View style={styles.passwordInput}>
            <TextInput
              style={styles.input}
              placeholder="Digite sua senha atual"
              placeholderTextColor="#999"
              secureTextEntry={!showCurrentPassword}
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />

            <TouchableOpacity
              onPress={() =>
                setShowCurrentPassword(
                  !showCurrentPassword
                )
              }
            >
              <Ionicons
                name={
                  showCurrentPassword
                    ? "eye-off-outline"
                    : "eye-outline"
                }
                size={22}
                color="#777"
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Nova senha
          </Text>

          <View style={styles.passwordInput}>
            <TextInput
              style={styles.input}
              placeholder="Digite sua nova senha"
              placeholderTextColor="#999"
              secureTextEntry={!showNewPassword}
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <TouchableOpacity
              onPress={() =>
                setShowNewPassword(
                  !showNewPassword
                )
              }
            >
              <Ionicons
                name={
                  showNewPassword
                    ? "eye-off-outline"
                    : "eye-outline"
                }
                size={22}
                color="#777"
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Confirmar nova senha
          </Text>

          <View style={styles.passwordInput}>
            <TextInput
              style={styles.input}
              placeholder="Digite novamente a nova senha"
              placeholderTextColor="#999"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <TouchableOpacity
              onPress={() =>
                setShowConfirmPassword(
                  !showConfirmPassword
                )
              }
            >
              <Ionicons
                name={
                  showConfirmPassword
                    ? "eye-off-outline"
                    : "eye-outline"
                }
                size={22}
                color="#777"
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleChangePassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>
              Alterar senha
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6FA",
  },

  header: {
    height: 64,
    marginTop: 30,
    backgroundColor: "#FFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  placeholder: {
    width: 40,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
  },

  content: {
    padding: 20,
  },

  description: {
    fontSize: 15,
    lineHeight: 22,
    color: "#666",
    marginBottom: 25,
  },

  inputContainer: {
    marginBottom: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },

  passwordInput: {
    height: 54,
    backgroundColor: "#FFF",
    borderRadius: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: "#222",
  },

  button: {
    height: 54,
    marginTop: 15,
    backgroundColor: "#1677FF",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
});