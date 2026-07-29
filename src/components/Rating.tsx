import { Text } from "react-native";

interface RatingProps {
  value: number;
}

export function Rating({ value }: RatingProps) {
  return (
    <Text>
      ⭐ {value.toFixed(1)}
    </Text>
  );
}