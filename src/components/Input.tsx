import { colors } from "@/src/theme/colors";
import { StyleSheet, TextInput } from "react-native";

interface InputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
}

export function Input({
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
}: InputProps) {
  return (
    <TextInput
      style={styles.container}
      placeholder={placeholder}
      placeholderTextColor={colors.gray400}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    height: 52,
    backgroundColor: colors.gray100,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.black,
  },
});