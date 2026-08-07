import { colors } from "@/src/theme/colors";
import { router } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View, } from "react-native";

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

      <Pressable
  style={styles.startButton}
  onPress={() => router.push("/(auth)/login")}
>

  <Text style={styles.startText}>
    Começar agora
  </Text>

  <View style={styles.arrowCircle}>
    <Text style={styles.arrow}>
      →
    </Text>
  </View>

</Pressable>

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
  startButton: {
  width: "100%",
  height: 70,

  borderRadius: 35,

  backgroundColor: "#1664FF",

  marginTop: 35,

  flexDirection: "row",

  alignItems: "center",

  justifyContent: "center",

  elevation: 10,
},

startText: {
  color: "#FFF",

  fontSize: 28,

  fontWeight: "700",
},

arrowCircle: {
  position: "absolute",

  right: 8,

  width: 56,

  height: 56,

  borderRadius: 28,

  backgroundColor: "#FFF",

  justifyContent: "center",

  alignItems: "center",
},

arrow: {
  color: "#1664FF",

  fontSize: 34,

  fontWeight: "700",
},
});