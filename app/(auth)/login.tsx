import { Button } from "@/src/components/Button";
import { Input } from "@/src/components/Input";
import { useUser } from "@/src/contexts/UserContext";
import { auth, db } from "@/src/services/firebase";
import { colors } from "@/src/theme/colors";
import { AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";

import {
  signInWithEmailAndPassword,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  Alert, Image, StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function Login() {

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const { setUser } = useUser();

 async function handleLogin() {
  try {
    const credential =
      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        senha
      );

    const userDoc = await getDoc(
      doc(db, "users", credential.user.uid)
    );

    if (!userDoc.exists()) {
      Alert.alert(
        "Erro",
        "Usuário não encontrado."
      );

      return;
    }

    const user = {
      id: credential.user.uid,
      ...(userDoc.data() as any),
    };

    await setUser(user);

    router.replace("/(tabs)");
  } catch (error: any) {
    Alert.alert(
      "Erro",
      error.message
    );
  }
}

  return (
    <View style={styles.container}>

      <Image
        source={require("@/assets/images/logo.png")}
        style={styles.logo}
      />

      <Text style={styles.subtitle}>
        Entre na sua conta
      </Text>

      <Input
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />

      <Input
        placeholder="Senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
      />

      <Button
        title="Entrar"
        onPress={handleLogin}
      />

      <View style={styles.dividerContainer}>
        <View style={styles.line} />
        <Text style={styles.or}>ou</Text>
        <View style={styles.line} />
      </View>

      <TouchableOpacity
        style={styles.googleButton}
        onPress={() => {}}
      >
        <AntDesign
          name="google"
          size={22}
          color="#DB4437"
        />

        <Text style={styles.googleText}>
          Continuar com Google
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/(auth)/cadastro")}
      >
        <Text style={styles.register}>
          Não possui conta? Criar conta
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    gap: 16,
    backgroundColor: colors.background,
  },

  logo: {
    width: 350,
    height: 150,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 18,
    textAlign: "center",
    color: colors.gray600,
    marginBottom: 20,
  },

  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },

  or: {
    marginHorizontal: 12,
    color: colors.gray600,
    fontWeight: "600",
  },

  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingVertical: 14,
    gap: 10,
    backgroundColor: "#fff",
  },

  googleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },

  register: {
    textAlign: "center",
    color: colors.primary,
    fontWeight: "700",
    marginTop: 10,
  },

});