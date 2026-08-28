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

export default function TermsOfUseScreen() {
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
          Termos de Uso
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
          Estes Termos de Uso estabelecem as condições
          para utilização da plataforma ServiçoJá. Ao criar
          uma conta ou utilizar o aplicativo, você concorda
          com estes termos.
        </Text>

        <Section
          number="1"
          title="Sobre o ServiçoJá"
          text="O ServiçoJá é uma plataforma que busca conectar pessoas que procuram serviços a profissionais e prestadores que desejam divulgar seus serviços."
        />

        <Section
          number="2"
          title="Uso da plataforma"
          text="O usuário deve utilizar o ServiçoJá de forma responsável, respeitando a legislação aplicável, os direitos de outros usuários e as regras estabelecidas nestes Termos de Uso."
        />

        <Section
          number="3"
          title="Conta do usuário"
          text="O usuário é responsável pelas informações fornecidas durante o cadastro e pela utilização de sua conta. Informações falsas, enganosas ou utilizadas de forma indevida poderão resultar em medidas como restrição, suspensão ou encerramento da conta, conforme aplicável."
        />

        <Section
          number="4"
          title="Responsabilidade pelos serviços"
          text="Os profissionais são responsáveis pelas informações divulgadas, pelos serviços oferecidos, pela execução dos trabalhos e pelos acordos realizados com clientes. Os clientes também são responsáveis pelas decisões e negociações realizadas com profissionais."
        />

        <Section
          number="5"
          title="Negociações entre usuários"
          text="O ServiçoJá disponibiliza recursos para facilitar o contato entre usuários. As condições de cada serviço, incluindo valores, prazos, formas de pagamento e execução, podem ser definidas diretamente entre as partes, conforme os recursos disponíveis na plataforma."
        />

        <Section
          number="6"
          title="Anúncios e conteúdos"
          text="Os usuários são responsáveis pelos conteúdos, imagens, descrições e demais informações que publicarem. Não é permitido publicar informações falsas, enganosas, ilegais ou que violem direitos de terceiros."
        />

        <Section
          number="7"
          title="Condutas proibidas"
          text="Não é permitido utilizar a plataforma para práticas ilegais, fraudes, golpes, assédio, ameaças, envio de conteúdos ofensivos, violação de direitos de terceiros ou qualquer outra atividade que possa prejudicar usuários ou o funcionamento do ServiçoJá."
        />

        <Section
          number="8"
          title="Comunicação entre usuários"
          text="Os recursos de comunicação devem ser utilizados de maneira respeitosa e para finalidades compatíveis com a plataforma. O uso indevido poderá resultar em medidas relacionadas à conta, conforme a gravidade da situação."
        />

        <Section
          number="9"
          title="Suspensão ou encerramento de contas"
          text="O ServiçoJá poderá adotar medidas para restringir, suspender ou encerrar contas quando identificar violação destes Termos de Uso, atividades suspeitas, tentativas de fraude, uso indevido da plataforma ou quando necessário para proteger usuários e o funcionamento do serviço."
        />

        <Section
          number="10"
          title="Disponibilidade da plataforma"
          text="O ServiçoJá busca manter seus recursos disponíveis e funcionando adequadamente. No entanto, poderão ocorrer interrupções temporárias para manutenção, atualizações, correções, melhorias ou situações fora do nosso controle."
        />

        <Section
          number="11"
          title="Limitação de responsabilidade"
          text="O ServiçoJá atua como plataforma de conexão entre usuários e não garante, por si só, a qualidade, disponibilidade, execução ou resultado dos serviços negociados entre clientes e profissionais. Cada usuário deve avaliar as informações disponíveis e tomar suas próprias decisões antes de realizar uma contratação ou prestação de serviço."
        />

        <Section
          number="12"
          title="Alterações nos Termos"
          text="Estes Termos de Uso poderão ser atualizados para acompanhar mudanças no funcionamento da plataforma, inclusão de novos recursos ou alterações legais. A versão atualizada poderá ser disponibilizada dentro do aplicativo."
        />

        <View style={styles.noticeCard}>
          <Ionicons
            name="information-circle-outline"
            size={26}
            color="#1677FF"
          />

          <Text style={styles.noticeTitle}>
            Uso responsável
          </Text>

          <Text style={styles.noticeText}>
            Recomendamos que usuários verifiquem as
            informações e condições antes de contratar
            ou prestar qualquer serviço.
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

  noticeCard: {
    backgroundColor: "#EAF3FF",
    borderRadius: 18,
    padding: 22,
    alignItems: "center",
    marginTop: 10,
  },

  noticeTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#222",
    marginTop: 10,
    marginBottom: 8,
  },

  noticeText: {
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