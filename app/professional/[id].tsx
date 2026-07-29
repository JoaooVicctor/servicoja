import { Avatar } from "@/src/components/Avatar";
import { Button } from "@/src/components/Button";
import { Rating } from "@/src/components/Rating";
import { useFavorites } from "@/src/contexts/FavoritesContext";
import { professionals } from "@/src/data/professionals";
import { colors } from "@/src/theme/colors";
import { router, useLocalSearchParams } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";


export default function ProfessionalProfile() {

  const { id } = useLocalSearchParams();

  const {
  addFavorite,
  removeFavorite,
  isFavorite,
} = useFavorites();


const favorite = isFavorite(id as string);


  const professional = professionals.find(
    (item) => item.id === id
  );


  if (!professional) {
    return (
      <View style={styles.container}>
        <Text>
          Profissional não encontrado.
        </Text>
      </View>
    );
  }


  return (

    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >


      <View style={styles.profile}>


        <Avatar
          name={professional.name}
          size={100}
        />


        <Text style={styles.name}>
          {professional.name}
        </Text>


        <Text style={styles.profession}>
          {professional.profession}
        </Text>


        <Rating
          value={professional.rating}
        />


        <Text style={styles.city}>
          📍 {professional.city}
        </Text>


      </View>



      <View style={styles.card}>


        <Text style={styles.title}>
          Sobre o profissional
        </Text>


        <Text style={styles.description}>
          Profissional especializado em {professional.profession}.
          Trabalha oferecendo serviços de qualidade e atendimento
          personalizado para seus clientes.
        </Text>


      </View>



      <View style={styles.card}>


        <Text style={styles.title}>
          Serviços oferecidos
        </Text>


        <Text style={styles.service}>
          ✅ Atendimento residencial
        </Text>


        <Text style={styles.service}>
          ✅ Orçamento personalizado
        </Text>


        <Text style={styles.service}>
          ✅ Serviço com garantia
        </Text>


      </View>

      <Button
        title={
          favorite
            ? "💙 Remover favorito"
            : "❤️ Favoritar"
        }
        onPress={() => {

          if (favorite) {
            removeFavorite(id as string);
          } else {
            addFavorite(id as string);
          }

        }}
      />


      <Button
        title="💬 Conversar"
        onPress={() =>
          router.push({
            pathname: "/chat",
            params: {
              id: professional.id,
            },
          })
        }
      />


    </ScrollView>

  );
}



const styles = StyleSheet.create({

  container:{
    flex:1,
    backgroundColor:colors.background,
    padding:24,
  },


  profile:{
    alignItems:"center",
    gap:12,
    marginTop:20,
  },


  name:{
    fontSize:28,
    fontWeight:"800",
    color:colors.black,
  },


  profession:{
    fontSize:17,
    color:colors.gray600,
  },


  city:{
    color:colors.gray600,
  },


  card:{
    backgroundColor:"#fff",
    marginTop:25,
    padding:20,
    borderRadius:18,
    elevation:3,
  },


  title:{
    fontSize:20,
    fontWeight:"700",
    color:colors.black,
    marginBottom:10,
  },


  description:{
    color:colors.gray600,
    lineHeight:22,
  },


  service:{
    marginTop:8,
    color:colors.gray600,
    fontSize:16,
  },


});