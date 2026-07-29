import { ServiceCard } from "@/src/components/ServiceCard";
import { useFavorites } from "@/src/contexts/FavoritesContext";
import { useServices } from "@/src/contexts/ServiceContext";
import { Ionicons } from "@expo/vector-icons";

import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function Favorites() {
  const { favorites } = useFavorites();
  const { services } = useServices();

  const favoriteServices = services.filter(
    (service) => favorites.includes(service.id)
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>
            Meus favoritos
          </Text>

          <Text style={styles.subtitle}>
            Serviços que você salvou para ver depois.
          </Text>
        </View>

        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {favoriteServices.length}
          </Text>
        </View>
      </View>

      {favoriteServices.length > 0 ? (
        <View style={styles.servicesContainer}>
          {favoriteServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons
              name="heart-outline"
              size={50}
              color="#1677FF"
            />
          </View>

          <Text style={styles.emptyTitle}>
            Nenhum favorito ainda
          </Text>

          <Text style={styles.emptyDescription}>
            Toque no coração de um serviço para salvá-lo
            aqui.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7F9",
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 120,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  title: {
    fontSize: 29,
    fontWeight: "800",
    color: "#202020",
  },

  subtitle: {
    maxWidth: 270,
    fontSize: 15,
    color: "#6D6D6D",
    lineHeight: 21,
    marginTop: 6,
  },

  counter: {
    minWidth: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E6F1FF",
    alignItems: "center",
    justifyContent: "center",
  },

  counterText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1677FF",
  },

  servicesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 25,
  },

  emptyContainer: {
    marginTop: 55,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingHorizontal: 25,
    paddingVertical: 45,
    alignItems: "center",

    borderWidth: 1,
    borderColor: "#EAEAEA",

    elevation: 2,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },

  emptyIconContainer: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "#EAF3FF",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#252525",
    marginTop: 20,
  },

  emptyDescription: {
    fontSize: 15,
    color: "#737373",
    lineHeight: 22,
    textAlign: "center",
    marginTop: 9,
  },
});