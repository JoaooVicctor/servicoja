import { useServices } from "@/src/contexts/ServiceContext";
import { useUser } from "@/src/contexts/UserContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function MyServices() {
  const { user } = useUser();

  const {
    services,
    deleteService,
  } = useServices();

  const myServices = services.filter(
    (service) => service.userId === user?.id
  );

  function handleOpenService(id: string) {
    router.push({
      pathname: "/service/[id]",
      params: {
        id,
      },
    });
  }

  function confirmDeleteService(
    id: string,
    title: string
  ) {
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        `Deseja excluir o anúncio "${title}"?`
      );

      if (confirmed) {
        deleteService(id);
      }

      return;
    }

    Alert.alert(
      "Excluir anúncio",
      `Deseja realmente excluir "${title}"?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => deleteService(id),
        },
      ]
    );
  }

  function handlePublishService() {
    router.push({
      pathname: "/(tabs)/publicar",
      params: {
        editId: "",
      },
    });
  }

  function handleEditService(id: string) {
    router.push({
      pathname: "/(tabs)/publicar",
      params: {
        editId: id,
      },
    });
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>
            Meus serviços
          </Text>

          <Text style={styles.subtitle}>
            Gerencie os anúncios que você publicou.
          </Text>
        </View>

        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {myServices.length}
          </Text>
        </View>
      </View>

      {myServices.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons
              name="briefcase-outline"
              size={48}
              color="#1677FF"
            />
          </View>

          <Text style={styles.emptyTitle}>
            Nenhum serviço publicado
          </Text>

          <Text style={styles.emptyDescription}>
            Publique seu primeiro serviço para que
            outras pessoas possam encontrá-lo.
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.publishButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handlePublishService}
          >
            <Ionicons
              name="add-circle-outline"
              size={22}
              color="#FFFFFF"
            />

            <Text style={styles.publishButtonText}>
              Publicar serviço
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Pressable
            style={({ pressed }) => [
              styles.newServiceButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handlePublishService}
          >
            <Ionicons
              name="add"
              size={22}
              color="#1677FF"
            />

            <Text style={styles.newServiceText}>
              Publicar novo serviço
            </Text>
          </Pressable>

          <View style={styles.servicesContainer}>
            {myServices.map((service) => (
              <View
                key={service.id}
                style={styles.serviceCard}
              >
                <Pressable
                  style={({ pressed }) => [
                    styles.serviceContent,
                    pressed && styles.cardPressed,
                  ]}
                  onPress={() =>
                    handleOpenService(service.id)
                  }
                >
                  <Image
                    source={{
                      uri: service.images[0],
                    }}
                    style={styles.serviceImage}
                  />

                  <View style={styles.serviceInformation}>
                    <Text
                      style={styles.servicePrice}
                      numberOfLines={1}
                    >
                      {service.price}
                    </Text>

                    <Text
                      style={styles.serviceTitle}
                      numberOfLines={2}
                    >
                      {service.title}
                    </Text>

                    <View style={styles.informationRow}>
                      <Ionicons
                        name="pricetag-outline"
                        size={14}
                        color="#6D6D6D"
                      />

                      <Text
                        style={styles.informationText}
                        numberOfLines={1}
                      >
                        {service.category}
                      </Text>
                    </View>

                    <View style={styles.informationRow}>
                      <Ionicons
                        name="location-outline"
                        size={15}
                        color="#6D6D6D"
                      />

                      <Text
                        style={styles.informationText}
                        numberOfLines={1}
                      >
                        {service.city} -{" "}
                        {service.neighborhood}
                      </Text>
                    </View>
                  </View>
                </Pressable>

                <View style={styles.actionsContainer}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.viewButton,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() =>
                      handleOpenService(service.id)
                    }
                  >
                    <Ionicons
                      name="eye-outline"
                      size={19}
                      color="#1677FF"
                    />

                    <Text style={styles.viewButtonText}>
                      Visualizar
                    </Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.editButton,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() =>
                      handleEditService(service.id)
                    }
                  >
                    <Ionicons
                      name="create-outline"
                      size={19}
                      color="#F59E0B"
                    />

                    <Text style={styles.editButtonText}>
                      Editar
                    </Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.deleteButton,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() =>
                      confirmDeleteService(
                        service.id,
                        service.title
                      )
                    }
                  >
                    <Ionicons
                      name="trash-outline"
                      size={19}
                      color="#E53935"
                    />

                    <Text style={styles.deleteButtonText}>
                      Excluir
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </>
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
    maxWidth: 280,
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

  publishButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: "#1677FF",
    paddingHorizontal: 23,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 25,
  },

  publishButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  newServiceButton: {
    height: 53,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#1677FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 28,
  },

  newServiceText: {
    color: "#1677FF",
    fontSize: 15,
    fontWeight: "800",
  },

  servicesContainer: {
    gap: 16,
    marginTop: 18,
  },

  serviceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
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
    shadowRadius: 6,
  },

  serviceContent: {
    flexDirection: "row",
    padding: 12,
  },

  serviceImage: {
    width: 115,
    height: 115,
    borderRadius: 13,
    backgroundColor: "#E5E5E5",
  },

  serviceInformation: {
    flex: 1,
    paddingLeft: 14,
  },

  servicePrice: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1677FF",
  },

  serviceTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#252525",
    lineHeight: 22,
    marginTop: 5,
  },

  informationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 9,
  },

  informationText: {
    flex: 1,
    fontSize: 13,
    color: "#6D6D6D",
  },

  actionsContainer: {
    height: 57,
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },

  viewButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRightWidth: 1,
    borderRightColor: "#EEEEEE",
  },

  viewButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1677FF",
  },

  editButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRightWidth: 1,
    borderRightColor: "#EEEEEE",
  },

  editButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F59E0B",
  },

  deleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  deleteButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#E53935",
  },

  buttonPressed: {
    opacity: 0.7,
  },

  cardPressed: {
    opacity: 0.8,
  },
});