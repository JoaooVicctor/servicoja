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

export default function PrivacyPolicyScreen() {
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
          Política de Privacidade
        </Text>

        <View style={styles.placeholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.updated}>
          Última atualização: agosto de 2026
        </Text>

        <Text style={styles.introduction}>
          Esta Política de Privacidade explica como o
          ServiçoJá realiza o tratamento de informações
          relacionadas aos usuários da plataforma.
        </Text>

        <Section
          number="1"
          title="Quem somos"
          text="O ServiçoJá é uma plataforma desenvolvida para conectar pessoas que procuram serviços a profissionais que desejam divulgar e oferecer seus serviços."
        />

        <Section
          number="2"
          title="Informações que podemos coletar"
          text="Podemos tratar informações fornecidas pelo usuário durante o uso da plataforma, incluindo nome, endereço de e-mail, número de telefone quando informado, foto de perfil, informações de serviços publicados, conteúdos enviados em conversas e outras informações necessárias para o funcionamento dos recursos disponibilizados."
        />

        <Section
          number="3"
          title="Informações de localização"
          text="O ServiçoJá poderá solicitar acesso à localização do dispositivo apenas quando necessário para recursos que dependam dessa informação. O acesso dependerá da autorização concedida pelo usuário no dispositivo."
        />

        <Section
          number="4"
          title="Mensagens e conteúdos"
          text="As mensagens e conteúdos enviados dentro da plataforma são tratados para permitir a comunicação entre os usuários e o funcionamento dos recursos do ServiçoJá."
        />

        <Section
          number="5"
          title="Como utilizamos suas informações"
          text="As informações poderão ser utilizadas para criar e administrar contas, identificar usuários, disponibilizar recursos da plataforma, permitir a comunicação entre usuários, publicar e exibir serviços, melhorar a experiência de uso, manter a segurança da plataforma e cumprir obrigações legais quando aplicável."
        />

        <Section
          number="6"
          title="Serviços utilizados"
          text="Para disponibilizar determinados recursos, o ServiçoJá poderá utilizar serviços de terceiros. Atualmente, a plataforma utiliza serviços relacionados à autenticação e armazenamento de dados, hospedagem de imagens e funcionamento de notificações. Esses serviços poderão realizar o tratamento de informações necessárias para fornecer suas respectivas funcionalidades."
        />

        <Section
          number="7"
          title="Compartilhamento de informações"
          text="Determinadas informações do perfil e dos serviços publicados podem ser exibidas a outros usuários quando isso for necessário para o funcionamento da plataforma. Também poderemos compartilhar informações com fornecedores de tecnologia que auxiliem na operação do ServiçoJá, sempre de acordo com a finalidade necessária para a prestação dos serviços."
        />

        <Section
          number="8"
          title="Segurança"
          text="Adotamos medidas técnicas e organizacionais razoáveis para proteger as informações tratadas pela plataforma. No entanto, nenhum sistema de transmissão ou armazenamento de dados pode garantir segurança absoluta."
        />

        <Section
          number="9"
          title="Armazenamento e retenção"
          text="As informações poderão ser mantidas pelo período necessário para fornecer os serviços, cumprir obrigações legais, resolver disputas, prevenir fraudes e manter a segurança e o funcionamento da plataforma, conforme aplicável."
        />

        <Section
          number="10"
          title="Seus direitos"
          text="Nos termos da legislação aplicável, incluindo a Lei Geral de Proteção de Dados Pessoais, o titular dos dados poderá solicitar informações sobre o tratamento de seus dados, acesso, correção de dados incompletos ou desatualizados e outras medidas previstas na legislação, observadas as limitações e obrigações legais aplicáveis."
        />

        <Section
          number="11"
          title="Permissões do dispositivo"
          text="Alguns recursos do aplicativo podem solicitar permissões, como acesso à galeria, câmera, localização ou notificações. O usuário poderá gerenciar determinadas permissões diretamente nas configurações do dispositivo."
        />

        <Section
          number="12"
          title="Alterações nesta política"
          text="Esta Política de Privacidade poderá ser atualizada periodicamente para refletir alterações no funcionamento do ServiçoJá, melhorias na plataforma ou mudanças legais e regulatórias. A versão atualizada poderá ser disponibilizada dentro do aplicativo."
        />

        <View style={styles.contactCard}>
          <Ionicons
            name="mail-outline"
            size={28}
            color="#1677FF"
          />

          <Text style={styles.contactTitle}>
            Dúvidas sobre privacidade
          </Text>

          <Text style={styles.contactText}>
            Caso tenha dúvidas sobre esta Política de
            Privacidade ou sobre o tratamento de suas
            informações, entre em contato conosco pelos
            canais oficiais do ServiçoJá.
          </Text>
        </View>

        <Text style={styles.footer}>
          ServiçoJá
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {number}. {title}
      </Text>

      <Text style={styles.sectionText}>
        {text}
      </Text>
    </View>
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
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },

  content: {
    padding: 20,
    paddingBottom: 50,
  },

  updated: {
    fontSize: 13,
    color: "#888",
    marginBottom: 18,
  },

  introduction: {
    fontSize: 15,
    lineHeight: 23,
    color: "#555",
    marginBottom: 28,
  },

  section: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
    marginBottom: 9,
  },

  sectionText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#666",
  },

  contactCard: {
    backgroundColor: "#EAF3FF",
    borderRadius: 18,
    padding: 22,
    alignItems: "center",
    marginTop: 10,
  },

  contactTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#222",
    marginTop: 10,
    marginBottom: 8,
  },

  contactText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#555",
    textAlign: "center",
  },

  footer: {
    textAlign: "center",
    marginTop: 30,
    color: "#999",
    fontSize: 13,
  },
});