import { Button } from "@/src/components/Button";
import { useUser } from "@/src/contexts/UserContext";
import { colors } from "@/src/theme/colors";
import { router } from "expo-router";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function Profile() {
  const { user, logout } = useUser();

  async function handleLogout() {
    await logout();
    router.replace("/");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        👤 Meu Perfil
      </Text>

      <View style={styles.card}>
        <Text style={styles.name}>
          {user?.name || "Usuário"}
        </Text>

        <Text style={styles.info}>
          📧 {user?.email || "Sem email"}
        </Text>

        <Text style={styles.info}>
          📱 {user?.phone || "Sem telefone"}
        </Text>

        <Text style={styles.info}>
          Tipo: {user?.type || "Cliente"}
        </Text>
      </View>

      <Button
        title="Sair"
        onPress={handleLogout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    paddingTop: 50,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.black,
    marginBottom: 30,
  },

  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 18,
    elevation: 3,
    gap: 10,
    marginBottom: 30,
  },

  name: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.black,
  },

  info: {
    fontSize: 16,
    color: colors.gray600,
  },
});