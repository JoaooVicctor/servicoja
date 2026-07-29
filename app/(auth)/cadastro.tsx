import { Button } from "@/src/components/Button";
import { Input } from "@/src/components/Input";
import { useUser } from "@/src/contexts/UserContext";
import { auth, db } from "@/src/services/firebase";
import { saveUser } from "@/src/storage/userStorage";
import { colors } from "@/src/theme/colors";
import { router } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

export default function Cadastro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");

  const { setUser } = useUser();



  async function handleCadastro() {
  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      senha
    );

    const newUser = {
      id: credential.user.uid,
      name: nome,
      email,
      phone: telefone,
    };

    await setDoc(doc(db, "users", credential.user.uid), {
      name: nome,
      email,
      phone: telefone,
      createdAt: new Date().toISOString(),
    });

    setUser(newUser);

    await saveUser(newUser);

    router.replace("/(tabs)");
  } catch (error: any) {
    alert(error.message);
  }
}

  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/logo.png")}
        style={styles.logo}
      />

<Text style={styles.title}>
  Criar conta
</Text>

      <Input
        placeholder="Nome completo"
        value={nome}
        onChangeText={setNome}
      />

      <Input
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />

      <Input
        placeholder="Telefone"
        value={telefone}
        onChangeText={setTelefone}
      />

      <Input
        placeholder="Senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
      />

      <Button
        title="Cadastrar"
        onPress={handleCadastro}
      />
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

  title: {
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    color: colors.black,
    marginBottom: 20,
  },

  logo: {
    width: 350,
    height: 150,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 10,
  },
});