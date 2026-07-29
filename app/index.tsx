import { Button } from "@/src/components/Button";
import { useUser } from "@/src/contexts/UserContext";
import { colors } from "@/src/theme/colors";
import { router } from "expo-router";
import { useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";

export default function Index() {
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      router.replace("/(tabs)");
    }
  }, [user]);

  return (
    <View style={styles.container}>

      <Image
        source={require("@/assets/images/logo.png")}
        style={styles.logo}
      />

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
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: colors.background,
  },

  logo: {
    width: 350,
    height: 150,
    resizeMode: "contain",
    marginBottom: 70,
  },

});