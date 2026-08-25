import { useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { useRouter } from "expo-router";

import { useServices } from "@/src/contexts/ServiceContext";
import { useUser } from "@/src/contexts/UserContext";

import { db } from "@/src/services/firebase";

import {
  doc,
  updateDoc,
} from "firebase/firestore";

export default function EditProfileScreen() {
  const router = useRouter();

  const { user, setUser } = useUser();

  const { updateUserServices } = useServices();

  const [name, setName] = useState(
    user?.name ?? ""
  );

  const [loading, setLoading] =
    useState(false);

  async function handleSave() {
    const trimmedName = name.trim();

    if (!trimmedName) {
      Alert.alert(
        "Nome obrigatório",
        "Digite seu nome para continuar."
      );

      return;
    }

    if (trimmedName.length > 25) {
      Alert.alert(
        "Nome muito longo",
        "O nome pode ter no máximo 25 caracteres."
      );

      return;
    }

    if (!user) {
      Alert.alert(
        "Erro",
        "Usuário não encontrado."
      );

      return;
    }

    try {
      setLoading(true);

      // Atualiza o nome no Firestore
      await updateDoc(
        doc(db, "users", user.id),
        {
          name: trimmedName,
        }
      );

      const updatedUser = {
        ...user,
        name: trimmedName,
      };

      // Atualiza o usuário no contexto
      await setUser(updatedUser);

      // Atualiza o nome em todos os anúncios
      await updateUserServices({
        userId: updatedUser.id,
        userName: updatedUser.name,
        userPhoto: updatedUser.photoURL,
      });

      Alert.alert(
        "Perfil atualizado",
        "Seu nome foi atualizado com sucesso."
      );

      router.back();
    } catch (error) {
      console.log(
        "Erro ao atualizar perfil:",
        error
      );

      Alert.alert(
        "Erro",
        "Não foi possível atualizar seu perfil."
      );
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={25}
            color="#202020"
          />
        </Pressable>

        <Text style={styles.headerTitle}>
          Editar perfil
        </Text>

        <View style={styles.headerSide} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.label}>
            Nome
          </Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="person-outline"
              size={21}
              color="#777"
            />

            <TextInput
              value={name}
              onChangeText={(text) =>
                setName(text.slice(0, 25))
              }
              maxLength={25}
              placeholder="Digite seu nome"
              placeholderTextColor="#999"
              style={styles.input}
            />
          </View>

          <Text style={styles.characterCount}>
            {name.length}/25
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>
            Telefone
          </Text>

          <View style={styles.disabledInput}>
            <Ionicons
              name="call-outline"
              size={21}
              color="#888"
            />

            <Text style={styles.disabledText}>
              {user.phone || "Não informado"}
            </Text>

            <Ionicons
              name="lock-closed-outline"
              size={18}
              color="#999"
            />
          </View>

          <Text style={styles.infoText}>
            O telefone não pode ser alterado no momento.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>
            E-mail
          </Text>

          <View style={styles.disabledInput}>
            <Ionicons
              name="mail-outline"
              size={21}
              color="#888"
            />

            <Text
              style={styles.disabledText}
              numberOfLines={1}
            >
              {user.email}
            </Text>

            <Ionicons
              name="lock-closed-outline"
              size={18}
              color="#999"
            />
          </View>

          <Text style={styles.infoText}>
            O e-mail não pode ser alterado no momento.
          </Text>
        </View>

        <Pressable
          style={[
            styles.saveButton,
            loading && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={22}
                color="#FFFFFF"
              />

              <Text style={styles.saveButtonText}>
                Salvar alterações
              </Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  header: {
  height: 100,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: 16,
  paddingTop: 28,
  borderBottomWidth: 1,
  borderBottomColor: "#EEEEEE",
},

  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  headerSide: {
    width: 44,
  },

  headerTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#202020",
  },

  content: {
    padding: 20,
    paddingTop: 28,
    paddingBottom: 40,
  },

  section: {
    marginBottom: 25,
  },

  label: {
    fontSize: 15,
    fontWeight: "700",
    color: "#202020",
    marginBottom: 9,
  },

  inputContainer: {
    height: 56,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  input: {
    flex: 1,
    height: "100%",
    marginLeft: 12,
    fontSize: 16,
    color: "#202020",
  },

  characterCount: {
    fontSize: 12,
    color: "#888888",
    textAlign: "right",
    marginTop: 6,
  },

  disabledInput: {
    minHeight: 56,
    borderRadius: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },

  disabledText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: "#777777",
  },

  infoText: {
    fontSize: 12,
    color: "#999999",
    marginTop: 7,
    marginLeft: 2,
  },

  saveButton: {
    height: 56,
    backgroundColor: "#1677FF",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 9,
    marginTop: 10,
  },

  saveButtonDisabled: {
    opacity: 0.7,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});