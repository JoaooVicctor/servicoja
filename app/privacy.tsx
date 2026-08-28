import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function PrivacyScreen() {
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
          Privacidade
        </Text>

        <View style={styles.placeholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name="shield-checkmark-outline"
            size={42}
            color="#1677FF"
          />
        </View>

        <Text style={styles.mainTitle}>
          Sua privacidade
        </Text>

        <Text style={styles.description}>
          No ServiçoJá, utilizamos informações necessárias
          para criar sua conta, permitir a comunicação entre
          usuários e oferecer os recursos do aplicativo.
        </Text>

        <TouchableOpacity
          style={styles.option}
          onPress={() => router.push("/privacy-policy")}
        >
          <View style={styles.optionIcon}>
            <Ionicons
              name="document-text-outline"
              size={24}
              color="#1677FF"
            />
          </View>

          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>
              Política de Privacidade
            </Text>

            <Text style={styles.optionDescription}>
              Saiba quais informações coletamos, como elas
              são utilizadas e quais são seus direitos.
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={22}
            color="#999"
          />
        </TouchableOpacity>

        <TouchableOpacity
  style={[styles.option, styles.termsOption]}
  onPress={() => router.push("/terms-of-use")}
>
  <View style={styles.optionIcon}>
    <Ionicons
      name="reader-outline"
      size={24}
      color="#1677FF"
    />
  </View>

  <View style={styles.optionContent}>
    <Text style={styles.optionTitle}>
      Termos de Uso
    </Text>

    <Text style={styles.optionDescription}>
      Conheça as regras e condições para utilizar
      o ServiçoJá.
    </Text>
  </View>

  <Ionicons
    name="chevron-forward"
    size={22}
    color="#999"
  />
</TouchableOpacity>

        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle-outline"
            size={21}
            color="#1677FF"
          />

          <Text style={styles.infoText}>
            Recomendamos que você leia nossa Política de
            Privacidade para entender como seus dados são
            tratados dentro do ServiçoJá.
          </Text>
        </View>
      </ScrollView>
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
    paddingBottom: 40,
  },

  iconContainer: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "#EAF3FF",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 15,
    marginBottom: 20,
  },

  mainTitle: {
    fontSize: 23,
    fontWeight: "700",
    color: "#222",
    textAlign: "center",
  },

  description: {
    fontSize: 14,
    lineHeight: 22,
    color: "#777",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 30,
  },

  option: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
  },

  optionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#EAF3FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  optionContent: {
    flex: 1,
    marginRight: 10,
  },

  optionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
    marginBottom: 5,
  },

  optionDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: "#777",
  },

  infoBox: {
    marginTop: 25,
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#EAF3FF",
    padding: 16,
    borderRadius: 16,
  },

  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    lineHeight: 20,
    color: "#555",
  },
  termsOption: {
  marginTop: 14,
},
});