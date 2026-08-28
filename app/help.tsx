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

export default function HelpScreen() {
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
          Ajuda
        </Text>

        <View style={styles.placeholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name="help-circle-outline"
            size={42}
            color="#1677FF"
          />
        </View>

        <Text style={styles.mainTitle}>
          Como podemos ajudar?
        </Text>

        <Text style={styles.mainDescription}>
          Encontre respostas para as dúvidas mais comuns
          sobre o ServiçoJá.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Perguntas frequentes
          </Text>

          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <Ionicons
                name="search-outline"
                size={22}
                color="#1677FF"
              />
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>
                Como encontrar um profissional?
              </Text>

              <Text style={styles.cardDescription}>
                Utilize a busca ou navegue pelas categorias
                para encontrar profissionais e serviços.
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <Ionicons
                name="briefcase-outline"
                size={22}
                color="#1677FF"
              />
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>
                Como anunciar um serviço?
              </Text>

              <Text style={styles.cardDescription}>
                Acesse a área de criação de serviços,
                preencha as informações e publique seu
                anúncio.
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <Ionicons
                name="chatbubble-outline"
                size={22}
                color="#1677FF"
              />
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>
                Problemas com mensagens
              </Text>

              <Text style={styles.cardDescription}>
                Verifique sua conexão com a internet e
                tente abrir novamente a conversa.
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <Ionicons
                name="person-outline"
                size={22}
                color="#1677FF"
              />
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>
                Problemas com minha conta
              </Text>

              <Text style={styles.cardDescription}>
                Você pode acessar Configurações para
                consultar informações da sua conta ou
                alterar sua senha.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.supportCard}>
          <View style={styles.supportIcon}>
            <Ionicons
              name="headset-outline"
              size={28}
              color="#1677FF"
            />
          </View>

          <Text style={styles.supportTitle}>
            Ainda precisa de ajuda?
          </Text>

          <Text style={styles.supportDescription}>
            Em breve você poderá entrar em contato
            diretamente com o suporte do ServiçoJá.
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EAF3FF",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 18,
  },

  mainTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222",
    textAlign: "center",
  },

  mainDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: "#777",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 28,
  },

  section: {
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#222",
    marginBottom: 14,
  },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    marginBottom: 14,
  },

  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#EAF3FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  cardContent: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
    marginBottom: 5,
  },

  cardDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: "#777",
  },

  supportCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginTop: 5,
  },

  supportIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#EAF3FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  supportTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#222",
    marginBottom: 8,
  },

  supportDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: "#777",
    textAlign: "center",
  },
});