import { colors } from "@/src/theme/colors";
import { StyleSheet, Text, View } from "react-native";

interface AvatarProps {
  name: string;
  size?: number;
}

export function Avatar({
  name,
  size = 56,
}: AvatarProps) {
  const firstLetter = name.charAt(0).toUpperCase();

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text style={styles.text}>
        {firstLetter}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  text: {
    color: colors.background,
    fontSize: 24,
    fontWeight: "700",
  },
});