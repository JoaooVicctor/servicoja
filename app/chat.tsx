import { professionals } from "@/src/data/professionals";
import { colors } from "@/src/theme/colors";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";


export default function Chat() {


  const { id } = useLocalSearchParams();


  const professional = professionals.find(
    (item) => item.id === id
  );



  const [message, setMessage] = useState("");


  const [messages, setMessages] = useState([
    {
      id: "1",
      text: "Olá! Como posso ajudar?",
      sender: "professional",
    },
  ]);



  function sendMessage() {

    if (!message.trim()) return;


    setMessages([
      ...messages,
      {
        id: Date.now().toString(),
        text: message,
        sender: "user",
      },
    ]);


    setMessage("");

  }



  return (

    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >


      <Text style={styles.title}>
        💬 {professional?.name || "Conversa"}
      </Text>


      <Text style={styles.subtitle}>
        {professional?.profession}
      </Text>



      <FlatList

        data={messages}

        keyExtractor={(item) => item.id}

        renderItem={({ item }) => (

          <View
            style={[
              styles.message,
              item.sender === "user"
                ? styles.userMessage
                : styles.professionalMessage,
            ]}
          >

            <Text>
              {item.text}
            </Text>

          </View>

        )}

      />



      <View style={styles.inputContainer}>


        <TextInput
          style={styles.input}
          placeholder="Digite uma mensagem..."
          value={message}
          onChangeText={setMessage}
        />


        <TouchableOpacity
          style={styles.button}
          onPress={sendMessage}
        >

          <Text style={styles.buttonText}>
            Enviar
          </Text>

        </TouchableOpacity>


      </View>


    </KeyboardAvoidingView>

  );
}



const styles = StyleSheet.create({

  container:{
    flex:1,
    backgroundColor:colors.background,
    padding:20,
  },


  title:{
    fontSize:24,
    fontWeight:"800",
    color:colors.black,
  },


  subtitle:{
    color:colors.gray600,
    marginBottom:20,
  },


  message:{
    padding:12,
    borderRadius:12,
    marginBottom:10,
    maxWidth:"80%",
  },


  userMessage:{
    alignSelf:"flex-end",
    backgroundColor:"#dbeafe",
  },


  professionalMessage:{
    alignSelf:"flex-start",
    backgroundColor:"#e5e7eb",
  },


  inputContainer:{
    flexDirection:"row",
    gap:10,
    alignItems:"center",
  },


  input:{
    flex:1,
    borderWidth:1,
    borderColor:"#ddd",
    borderRadius:10,
    padding:12,
  },


  button:{
    backgroundColor:colors.primary,
    padding:12,
    borderRadius:10,
  },


  buttonText:{
    color:"#fff",
    fontWeight:"700",
  },

});