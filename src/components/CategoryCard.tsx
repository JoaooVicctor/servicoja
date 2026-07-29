import { colors } from "@/src/theme/colors";
import { Pressable, StyleSheet, Text } from "react-native";

interface CategoryCardProps {
  name: string;
  icon: string;
  onPress?: () => void;
}

export function CategoryCard({
  name,
  icon,
  onPress,
}: CategoryCardProps) {
  return (
    <Pressable
      style={styles.container}
      onPress={onPress}
    >
      <Text style={styles.icon}>
        {icon}
      </Text>

      <Text style={styles.name}>
        {name}
      </Text>
    </Pressable>
  );
}


const styles = StyleSheet.create({

  container:{
    width:110,
    height:110,
    backgroundColor:colors.gray100,
    borderRadius:20,
    alignItems:"center",
    justifyContent:"center",
    marginRight:12,
  },


  icon:{
    fontSize:32,
    marginBottom:8,
  },


  name:{
    fontSize:14,
    fontWeight:"600",
    color:colors.black,
    textAlign:"center",
  },

});