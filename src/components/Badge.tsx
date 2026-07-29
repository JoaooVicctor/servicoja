import { colors } from "@/src/theme/colors";
import { StyleSheet, Text, View } from "react-native";

interface BadgeProps {
  title: string;
}

export function Badge({ title }: BadgeProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  text: {
    color: colors.background,
    fontSize: 12,
    fontWeight: "700",
  },
});