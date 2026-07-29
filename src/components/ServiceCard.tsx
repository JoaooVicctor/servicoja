import { useFavorites } from "@/src/contexts/FavoritesContext";
import { Service } from "@/src/types/Service";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface ServiceCardProps {
  service: Service;
}

export function ServiceCard({
  service,
}: ServiceCardProps) {
  const {
    isFavorite,
    toggleFavorite,
  } = useFavorites();

  const favorite = isFavorite(service.id);

  function handleOpenService() {
    router.push({
      pathname: "/service/[id]",
      params: {
        id: service.id,
      },
    });
  }

  async function handleToggleFavorite() {
    await toggleFavorite(service.id);
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
      onPress={handleOpenService}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri: service.images[0],
          }}
          style={styles.image}
        />

        <Pressable
          style={({ pressed }) => [
            styles.favoriteButton,
            pressed && styles.favoritePressed,
          ]}
          onPress={(event) => {
            event.stopPropagation();
            handleToggleFavorite();
          }}
          hitSlop={10}
        >
          <Ionicons
            name={
              favorite
                ? "heart"
                : "heart-outline"
            }
            size={22}
            color={
              favorite
                ? "#E53935"
                : "#333333"
            }
          />
        </Pressable>
      </View>

      <View style={styles.information}>
        <Text
          style={styles.price}
          numberOfLines={1}
        >
          {service.price}
        </Text>

        <Text
          style={styles.title}
          numberOfLines={2}
        >
          {service.title}
        </Text>

        <View style={styles.categoryContainer}>
          <Ionicons
            name="pricetag-outline"
            size={13}
            color="#666666"
          />

          <Text
            style={styles.category}
            numberOfLines={1}
          >
            {service.category}
          </Text>
        </View>

        <View style={styles.locationContainer}>
          <Ionicons
            name="location-outline"
            size={14}
            color="#777777"
          />

          <Text
            style={styles.location}
            numberOfLines={1}
          >
            {service.city} -{" "}
            {service.neighborhood}
          </Text>
        </View>

        <Text
          style={styles.userName}
          numberOfLines={1}
        >
          Por {service.userName}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "48.5%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    overflow: "hidden",

    borderWidth: 1,
    borderColor: "#E7E7E7",

    elevation: 2,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.07,
    shadowRadius: 5,
  },

  pressed: {
    opacity: 0.78,
    transform: [
      {
        scale: 0.98,
      },
    ],
  },

  imageContainer: {
    position: "relative",
  },

  image: {
    width: "100%",
    height: 145,
    backgroundColor: "#E8E8E8",
  },

  favoriteButton: {
    position: "absolute",
    top: 9,
    right: 9,

    width: 38,
    height: 38,
    borderRadius: 19,

    backgroundColor: "rgba(255,255,255,0.92)",

    alignItems: "center",
    justifyContent: "center",

    elevation: 3,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },

  favoritePressed: {
    opacity: 0.7,
    transform: [
      {
        scale: 0.9,
      },
    ],
  },

  information: {
    padding: 11,
  },

  price: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1677FF",
    marginBottom: 5,
  },

  title: {
    minHeight: 39,
    fontSize: 15,
    fontWeight: "700",
    color: "#202020",
    lineHeight: 19,
  },

  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },

  category: {
    flex: 1,
    fontSize: 12,
    color: "#666666",
  },

  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 6,
  },

  location: {
    flex: 1,
    fontSize: 12,
    color: "#777777",
  },

  userName: {
    fontSize: 12,
    color: "#929292",
    marginTop: 7,
  },
});