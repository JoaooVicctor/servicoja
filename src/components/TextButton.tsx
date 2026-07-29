import { colors } from "@/src/theme/colors";
import { Pressable, StyleSheet, Text } from "react-native";

interface TextButtonProps {
  title: string;
  onPress: () => void;
}

export function TextButton({
  title,
  onPress,
}: TextButtonProps) {

  return (
    <Pressable onPress={onPress}>
      <Text style={styles.text}>
        {title}
      </Text>
    </Pressable>
  );
}


const styles = StyleSheet.create({
  text:{
    color: colors.primary,
    fontWeight:"700",
    textAlign:"center",
  },
});