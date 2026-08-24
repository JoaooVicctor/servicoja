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
      style={styles.container}
      onPress={handleOpenService}
      android_ripple={{
        color: "transparent",
      }}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri: service.images[0],
          }}
          style={styles.image}
        />

        <Pressable
          style={styles.favoriteButton}
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
          R$ {service.price}
        </Text>

        <Text
          style={styles.title}
          numberOfLines={2}
        >
          {service.title}
        </Text>

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
            {service.neighborhood} - {service.city}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
  width: "50%",
  backgroundColor: "#FFFFFF",
  borderRadius: 14,
  overflow: "hidden",
  borderWidth: 1,
  borderColor: "#E7E7E7",
},

  imageContainer: {
    position: "relative",
    width: "100%",
    aspectRatio: 1,
  },

  image: {
    width: "100%",
    height: "100%",
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
    fontSize: 15,
    fontWeight: "700",
    color: "#202020",
    lineHeight: 19,
    marginBottom: 8,
  },

  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  location: {
    flex: 1,
    fontSize: 12,
    color: "#777777",
  },
});