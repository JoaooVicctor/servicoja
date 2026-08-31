import { Button } from "@/src/components/Button";
import { useServices } from "@/src/contexts/ServiceContext";
import { useUser } from "@/src/contexts/UserContext";

import {
  showError,
  showInfo,
  showSuccess,
} from "@/src/utils/toast";

import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";

import { updateProfilePhoto } from "@/src/services/userService";

import { router } from "expo-router";

import {
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
} from "firebase/auth";

import { auth } from "@/src/services/firebase";

import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useState } from "react";

import { User as FirebaseUser } from "firebase/auth";

function getCurrentAuthUser(): Promise<FirebaseUser | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        unsubscribe();
        resolve(firebaseUser);
      }
    );
  });
}


export default function Perfil() {
  const {
    user,
    logout,
    setUser,
    deleteAccount,
  } = useUser();

  const { updateUserServices } = useServices();

  const [deleteModalVisible, setDeleteModalVisible] =
    useState(false);

  const [deletePassword, setDeletePassword] =
    useState("");

  const [showDeletePassword, setShowDeletePassword] =
    useState(false);

  const [deletingAccount, setDeletingAccount] =
    useState(false);

  async function handleLogout() {
    await logout();

    router.replace("/");
  }

  function handleDeleteAccount() {
    setDeletePassword("");
    setShowDeletePassword(false);
    setDeleteModalVisible(true);
  }

  async function confirmDeleteAccount() {
    if (!deletePassword.trim()) {
      showError(
        "Senha obrigatória",
        "Digite sua senha atual para excluir sua conta."
      );
      return;
    }

    try {
      setDeletingAccount(true);

     const currentUser =
  auth.currentUser ??
  (await getCurrentAuthUser());

      if (!currentUser) {
        throw new Error(
          "Sua sessão não foi encontrada. Entre na conta novamente."
        );
      }

      if (!currentUser.email) {
        throw new Error(
          "Não foi possível identificar o e-mail da sua conta."
        );
      }

      const credential =
        EmailAuthProvider.credential(
          currentUser.email,
          deletePassword
        );

      // Confirma a identidade do usuário
      const reauthenticatedUser =
        await reauthenticateWithCredential(
          currentUser,
          credential
        );

      // Depois da confirmação,
      // executa a exclusão completa
      // Depois da confirmação,
// executa a exclusão completa
await deleteAccount(
  reauthenticatedUser.user,
  deletePassword
);

      setDeleteModalVisible(false);
      setDeletePassword("");

      // Vai para o início do app
      router.replace("/");
    } catch (error: any) {
      console.log(
        "ERRO AO EXCLUIR CONTA:",
        error
      );

      if (
        error?.code ===
        "auth/invalid-credential"
      ) {
        showError(
          "Senha incorreta",
          "A senha informada está incorreta."
        );
        return;
      }

      if (
        error?.code ===
        "auth/wrong-password"
      ) {
        showError(
          "Senha incorreta",
          "A senha informada está incorreta."
        );
        return;
      }

      if (
        error?.code ===
        "auth/user-mismatch"
      ) {
        showError(
          "Erro",
          "A conta não corresponde ao usuário atual."
        );
        return;
      }

      showError(
        "Erro",
        error instanceof Error
          ? error.message
          : "Não foi possível excluir sua conta."
      );
    } finally {
      setDeletingAccount(false);
    }
  }

  async function handleSelectPhoto() {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        showInfo(
          "Permissão necessária",
          "Permita o acesso à galeria para escolher uma foto."
        );

        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

      if (result.canceled) {
        return;
      }

      const imageUri = result.assets[0].uri;

      if (!user) {
        showError(
          "Erro",
          "Usuário não encontrado."
        );

        return;
      }

      const updatedUser =
        await updateProfilePhoto(
          user.id,
          imageUri
        );

      await setUser(updatedUser);

      await updateUserServices({
        userId: updatedUser.id,
        userName: updatedUser.name,
        userPhoto: updatedUser.photoURL,
      });

      showSuccess(
        "Foto atualizada",
        "Sua foto foi alterada em seu perfil e anúncios."
      );
    } catch (error: any) {
      console.log(
        "Erro ao atualizar foto:",
        error
      );

      showError(
        "Erro",
        error.message ||
          "Não foi possível atualizar sua foto."
      );
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#2196F3", "#1565C0"]}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handleSelectPhoto}
          >
            <Image
              source={{
                uri:
                  user?.photoURL ||
                  "https://ui-avatars.com/api/?background=2196F3&color=fff&name=" +
                    encodeURIComponent(
                      user?.name || "Usuário"
                    ),
              }}
              style={styles.avatar}
            />

            <View style={styles.cameraButton}>
              <Ionicons
                name="camera"
                size={18}
                color="#fff"
              />
            </View>
          </TouchableOpacity>

          <Text style={styles.name}>
            {user?.name || "Usuário"}
          </Text>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() =>
              router.push("/edit-profile")
            }
          >
            <Ionicons
              name="create-outline"
              size={18}
              color="#fff"
            />

            <Text style={styles.editButtonText}>
              Editar Perfil
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.infoItem}>
              <Ionicons
                name="mail-outline"
                size={22}
                color="#2196F3"
              />

              <View style={styles.infoTexts}>
                <Text style={styles.label}>
                  Email
                </Text>

                <Text style={styles.value}>
                  {user?.email ||
                    "Não informado"}
                </Text>
              </View>
            </View>

            <View style={styles.line} />

            <View style={styles.infoItem}>
              <Ionicons
                name="call-outline"
                size={22}
                color="#2196F3"
              />

              <View style={styles.infoTexts}>
                <Text style={styles.label}>
                  Telefone
                </Text>

                <Text style={styles.value}>
                  {user?.phone ||
                    "Não informado"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                0
              </Text>

              <Text style={styles.statTitle}>
                Serviços
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                0
              </Text>

              <Text style={styles.statTitle}>
                Conversas
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                0
              </Text>

              <Text style={styles.statTitle}>
                Favoritos
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                5.0
              </Text>

              <Text style={styles.statTitle}>
                Avaliação
              </Text>
            </View>
          </View>

          <View style={styles.menu}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() =>
                router.push("/settings")
              }
            >
              <Ionicons
                name="settings-outline"
                size={22}
                color="#2196F3"
              />

              <Text style={styles.menuText}>
                Configurações
              </Text>

              <Ionicons
                name="chevron-forward"
                size={20}
                color="#999"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() =>
                router.push("/notifications")
              }
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                color="#2196F3"
              />

              <Text style={styles.menuText}>
                Notificações
              </Text>

              <Ionicons
                name="chevron-forward"
                size={20}
                color="#999"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() =>
                router.push("/privacy")
              }
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={22}
                color="#2196F3"
              />

              <Text style={styles.menuText}>
                Privacidade
              </Text>

              <Ionicons
                name="chevron-forward"
                size={20}
                color="#999"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() =>
                router.push("/help")
              }
            >
              <Ionicons
                name="help-circle-outline"
                size={22}
                color="#2196F3"
              />

              <Text style={styles.menuText}>
                Ajuda
              </Text>

              <Ionicons
                name="chevron-forward"
                size={20}
                color="#999"
              />
            </TouchableOpacity>
          </View>

          <View
            style={{
              marginTop: 25,
              marginBottom: 40,
            }}
          >
            <Button
              title="Sair da conta"
              onPress={handleLogout}
            />

            <TouchableOpacity
              style={
                styles.deleteAccountButton
              }
              onPress={handleDeleteAccount}
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color="#E53935"
              />

              <Text
                style={
                  styles.deleteAccountText
                }
              >
                Excluir conta
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* MODAL DE CONFIRMAÇÃO DA SENHA */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!deletingAccount) {
            setDeleteModalVisible(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModal}>
            <View
              style={
                styles.deleteIconContainer
              }
            >
              <Ionicons
                name="trash-outline"
                size={28}
                color="#E53935"
              />
            </View>

            <Text style={styles.modalTitle}>
              Excluir conta
            </Text>

            <Text
              style={
                styles.modalDescription
              }
            >
              Para confirmar a exclusão permanente
              da sua conta, digite sua senha atual.
            </Text>

            <View
              style={
                styles.passwordContainer
              }
            >
              <TextInput
                style={styles.passwordInput}
                placeholder="Digite sua senha"
                placeholderTextColor="#999"
                secureTextEntry={
                  !showDeletePassword
                }
                value={deletePassword}
                onChangeText={
                  setDeletePassword
                }
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() =>
                  setShowDeletePassword(
                    !showDeletePassword
                  )
                }
              >
                <Ionicons
                  name={
                    showDeletePassword
                      ? "eye-off-outline"
                      : "eye-outline"
                  }
                  size={22}
                  color="#777"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={
                styles.confirmDeleteButton
              }
              onPress={
                confirmDeleteAccount
              }
              disabled={deletingAccount}
            >
              <Text
                style={
                  styles.confirmDeleteText
                }
              >
                {deletingAccount
                  ? "Excluindo..."
                  : "Excluir minha conta"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.cancelDeleteButton
              }
              onPress={() => {
                if (!deletingAccount) {
                  setDeleteModalVisible(false);
                  setDeletePassword("");
                }
              }}
              disabled={deletingAccount}
            >
              <Text
                style={
                  styles.cancelDeleteText
                }
              >
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F6FA",
  },

  container: {
    flex: 1,
    backgroundColor: "#F4F6FA",
  },

  header: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 90,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
  },

  avatarContainer: {
    position: "relative",
  },

  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#FFF",
    backgroundColor: "#DDD",
  },

  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },

  name: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFF",
    marginTop: 18,
  },

  editButton: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      "rgba(255,255,255,0.18)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
  },

  editButtonText: {
    color: "#FFF",
    marginLeft: 8,
    fontWeight: "700",
    fontSize: 15,
  },

  content: {
    marginTop: -50,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 22,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  infoTexts: {
    marginLeft: 15,
    flex: 1,
  },

  line: {
    height: 1,
    backgroundColor: "#ECECEC",
    marginVertical: 18,
  },

  label: {
    color: "#777",
    fontSize: 13,
  },

  value: {
    marginTop: 3,
    color: "#222",
    fontWeight: "600",
    fontSize: 16,
  },

  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 22,
  },

  statCard: {
    width: "48%",
    backgroundColor: "#FFF",
    borderRadius: 18,
    paddingVertical: 24,
    alignItems: "center",
    marginBottom: 15,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  statNumber: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2196F3",
  },

  statTitle: {
    marginTop: 6,
    color: "#666",
    fontWeight: "600",
  },

  menu: {
    marginTop: 10,
    backgroundColor: "#FFF",
    borderRadius: 22,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 18,
  },

  menuText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },

  deleteAccountButton: {
    marginTop: 18,
    height: 54,
    borderWidth: 1,
    borderColor: "#E53935",
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  deleteAccountText: {
    color: "#E53935",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  deleteModal: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 22,
    padding: 24,
  },

  deleteIconContainer: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#FFF0F0",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 16,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#222",
    textAlign: "center",
  },

  modalDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 20,
  },

  passwordContainer: {
    height: 54,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 14,
    backgroundColor: "#F8F9FA",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
    marginBottom: 15,
  },

  passwordInput: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: "#222",
  },

  eyeButton: {
    width: 50,
    height: 54,
    justifyContent: "center",
    alignItems: "center",
  },

  confirmDeleteButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#E53935",
    justifyContent: "center",
    alignItems: "center",
  },

  confirmDeleteText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },

  cancelDeleteButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#F0F2F5",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  cancelDeleteText: {
    color: "#333",
    fontSize: 15,
    fontWeight: "700",
  },
});