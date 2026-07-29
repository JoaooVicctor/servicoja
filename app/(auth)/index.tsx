import { Button } from "@/src/components/Button";
import { colors } from "@/src/theme/colors";
import { router } from "expo-router";
import { Image, StyleSheet, Text, View } from "react-native";

export default function Welcome() {
  return (
    <View style={styles.container}>

      <Image
        source={require("@/assets/images/logo.png")}
        style={styles.logo}
      />

      <Text style={styles.title}>
        Encontre profissionais
        para qualquer serviço
      </Text>

      <Text style={styles.subtitle}>
        Conectamos você com pessoas
        que resolvem seus problemas.
      </Text>

      <Button
        title="Começar"
        onPress={() => router.push("/(auth)/login")}
      />

    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    padding: 24,
  },

  logo: {
    width: 350,
    height: 150,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 10,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.black,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 16,
    color: colors.gray600,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 40,
  },
});