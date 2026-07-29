import { colors } from "@/src/theme/colors";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface OptionCardProps {
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}

export function OptionCard({
  title,
  description,
  icon,
  onPress,
}: OptionCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >

      <View style={styles.iconContainer}>
        <Text style={styles.icon}>
          {icon}
        </Text>
      </View>


      <View style={styles.content}>

        <Text style={styles.title}>
          {title}
        </Text>

        <Text style={styles.description}>
          {description}
        </Text>

      </View>


      <Text style={styles.arrow}>
        →
      </Text>

    </Pressable>
  );
}


const styles = StyleSheet.create({

  container: {
    backgroundColor: colors.background,
    padding: 20,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,

    elevation: 4,
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },

  pressed: {
    opacity: 0.7,
  },

  iconContainer: {
    width: 55,
    height: 55,
    borderRadius: 30,
    backgroundColor: colors.gray100,
    alignItems: "center",
    justifyContent: "center",
  },

  icon: {
    fontSize: 28,
  },

  content: {
    flex: 1,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.black,
  },

  description: {
    marginTop: 6,
    fontSize: 14,
    color: colors.gray600,
  },

  arrow: {
    fontSize: 26,
    color: colors.primary,
  },

});