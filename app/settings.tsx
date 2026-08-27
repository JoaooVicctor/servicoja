import { useUser } from "@/src/contexts/UserContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function Settings() {
  const { user } = useUser();

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
          Configurações
        </Text>

        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.item}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="person-outline"
                size={22}
                color="#1677FF"
              />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.label}>
                Nome
              </Text>

              <Text style={styles.value}>
                {user?.name || "Não informado"}
              </Text>
            </View>
          </View>

          <View style={styles.line} />

          <View style={styles.item}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="mail-outline"
                size={22}
                color="#1677FF"
              />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.label}>
                E-mail
              </Text>

              <Text style={styles.value}>
                {user?.email || "Não informado"}
              </Text>
            </View>
          </View>

          <View style={styles.line} />

          <View style={styles.item}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="call-outline"
                size={22}
                color="#1677FF"
              />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.label}>
                Telefone
              </Text>

              <Text style={styles.value}>
                {user?.phone || "Não informado"}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.passwordButton}
          onPress={() =>
          router.push("/change-password")
        }
        >
          <View style={styles.passwordLeft}>
            <View style={styles.passwordIcon}>
              <Ionicons
                name="lock-closed-outline"
                size={22}
                color="#1677FF"
              />
            </View>

            <Text style={styles.passwordText}>
              Alterar senha
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={22}
            color="#999"
          />
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

  card: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    paddingHorizontal: 18,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
  },

  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EAF3FF",
    justifyContent: "center",
    alignItems: "center",
  },

  textContainer: {
    marginLeft: 14,
    flex: 1,
  },

  label: {
    fontSize: 13,
    color: "#777",
  },

  value: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
    marginTop: 3,
  },

  line: {
    height: 1,
    backgroundColor: "#EEE",
  },

  passwordButton: {
    marginTop: 20,
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  passwordLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  passwordIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EAF3FF",
    justifyContent: "center",
    alignItems: "center",
  },

  passwordText: {
    marginLeft: 14,
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
  },
});