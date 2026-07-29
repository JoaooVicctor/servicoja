import { colors } from "@/src/theme/colors";
import { StyleSheet, TextInput } from "react-native";

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
}

export function SearchInput({
  value,
  onChangeText,
}: SearchInputProps) {
  return (
    <TextInput
      style={styles.container}
      placeholder="O que você precisa?"
      placeholderTextColor={colors.gray400}
      value={value}
      onChangeText={onChangeText}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    height: 52,
    backgroundColor: colors.gray100,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
  },
});