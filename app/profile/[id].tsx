import { useServices } from "@/src/contexts/ServiceContext";

import { Service } from "@/src/types/Service";

import { Ionicons } from "@expo/vector-icons";

import { useLocalSearchParams, useRouter } from "expo-router";

import { useMemo } from "react";

import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const router = useRouter();

  const { services } = useServices();

  const userServices = useMemo(() => {
    return services.filter(
      (service) => service.userId === id
    );
  }, [services, id]);

  const userData = userServices[0];

  if (!userData) {
    return (
      <View style={styles.notFoundContainer}>
        <Pressable
          style={styles.notFoundBackButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={25}
            color="#202020"
          />
        </Pressable>

        <Ionicons
          name="person-outline"
          size={55}
          color="#BBBBBB"
        />

        <Text style={styles.notFoundText}>
          Perfil não encontrado.
        </Text>
      </View>
    );
  }

  function renderService({
    item,
  }: {
    item: Service;
  }) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.serviceCard,
          pressed && styles.serviceCardPressed,
        ]}
        onPress={() =>
          router.push({
            pathname: "/service/[id]",
            params: {
              id: item.id,
            },
          })
        }
      >
        <View style={styles.serviceImageContainer}>
          <Image
            source={{
              uri: item.images[0],
            }}
            style={styles.serviceImage}
          />
        </View>

        <View style={styles.serviceInfo}>
          <Text
            style={styles.serviceTitle}
            numberOfLines={2}
          >
            {item.title}
          </Text>

          <Text style={styles.servicePrice}>
            R$ {item.price}
          </Text>

          <View style={styles.categoryContainer}>
            <Ionicons
              name="pricetag-outline"
              size={14}
              color="#1677FF"
            />

            <Text
              style={styles.serviceCategory}
              numberOfLines={1}
            >
              {item.category}
            </Text>
          </View>
        </View>

        <View style={styles.arrowContainer}>
          <Ionicons
            name="chevron-forward"
            size={22}
            color="#1677FF"
          />
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.blueBackground} />

      <FlatList
        data={userServices}
        keyExtractor={(item) => item.id}
        renderItem={renderService}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Pressable
                style={styles.headerButton}
                onPress={() => router.back()}
              >
                <Ionicons
                  name="arrow-back"
                  size={25}
                  color="#FFFFFF"
                />
              </Pressable>

              <Text style={styles.headerTitle}>
                Perfil
              </Text>

              <View style={styles.headerButtonPlaceholder} />
            </View>

            <View style={styles.profileSection}>
              <View style={styles.profileImageWrapper}>
                {userData.userPhoto ? (
                  <Image
                    source={{
                      uri: userData.userPhoto,
                    }}
                    style={styles.profileImage}
                  />
                ) : (
                  <View
                    style={
                      styles.profileImagePlaceholder
                    }
                  >
                    <Ionicons
                      name="person"
                      size={45}
                      color="#1677FF"
                    />
                  </View>
                )}
              </View>

              <Text style={styles.userName}>
                {userData.userName}
              </Text>

              <View style={styles.statsCard}>
                <View style={styles.statItem}>
                  <View style={styles.statIconBlue}>
                    <Ionicons
                      name="briefcase-outline"
                      size={23}
                      color="#1677FF"
                    />
                  </View>

                  <Text style={styles.statNumber}>
                    {userServices.length}
                  </Text>

                  <Text style={styles.statLabel}>
                    {userServices.length === 1
                      ? "Publicação"
                      : "Publicações"}
                  </Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                  <View style={styles.statIconYellow}>
                    <Ionicons
                      name="star"
                      size={23}
                      color="#F5B301"
                    />
                  </View>

                  <Text style={styles.statNumber}>
                    0
                  </Text>

                  <Text style={styles.statLabel}>
                    Avaliações
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.servicesSection}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionIcon}>
                  <Ionicons
                    name="briefcase-outline"
                    size={21}
                    color="#1677FF"
                  />
                </View>

                <Text style={styles.sectionTitle}>
                  Serviços publicados
                </Text>
              </View>

              <View style={styles.servicesCount}>
                <Text
                  style={styles.servicesCountText}
                >
                  {userServices.length === 1
                    ? "1 serviço"
                    : `${userServices.length} serviços`}
                </Text>
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="briefcase-outline"
                size={42}
                color="#9ABEEA"
              />
            </View>

            <Text style={styles.emptyText}>
              Nenhum serviço publicado.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  blueBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 340,
    backgroundColor: "#1677FF",
    borderBottomLeftRadius: 45,
    borderBottomRightRadius: 45,
  },

  listContent: {
    paddingBottom: 35,
  },

  header: {
  height: 100,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: 16,
  paddingTop: 28,
},

  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  headerButtonPlaceholder: {
    width: 44,
    height: 44,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  profileSection: {
    alignItems: "center",
    paddingTop: 18,
    paddingBottom: 30,
  },

  profileImageWrapper: {
    padding: 4,
    borderRadius: 58,
    backgroundColor: "#FFFFFF",
  },

  profileImage: {
    width: 106,
    height: 106,
    borderRadius: 53,
    backgroundColor: "#EEEEEE",
  },

  profileImagePlaceholder: {
    width: 106,
    height: 106,
    borderRadius: 53,
    backgroundColor: "#F2F7FD",
    alignItems: "center",
    justifyContent: "center",
  },

  userName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 14,
  },

  statsCard: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 28,
    marginHorizontal: 20,
    paddingVertical: 18,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },

  statItem: {
    width: 145,
    alignItems: "center",
  },

  statDivider: {
    width: 1,
    height: 80,
    backgroundColor: "#E8EEF5",
  },

  statIconBlue: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF3FF",
  },

  statIconYellow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7DD",
  },

  statNumber: {
    fontSize: 19,
    fontWeight: "800",
    color: "#202020",
    marginTop: 7,
  },

  statLabel: {
    fontSize: 12,
    color: "#777777",
    marginTop: 2,
  },

  servicesSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 5,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    borderTopWidth: 7,
    borderTopColor: "#F5F7FA",
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  sectionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EAF3FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#202020",
  },

  servicesCount: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: "#EAF3FF",
  },

  servicesCountText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1677FF",
  },

  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 13,
    padding: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E8EEF5",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  serviceCardPressed: {
    opacity: 0.85,
    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  serviceImageContainer: {
    width: 88,
    height: 88,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#EAF3FF",
  },

  serviceImage: {
    width: "100%",
    height: "100%",
  },

  serviceInfo: {
    flex: 1,
    paddingHorizontal: 13,
    justifyContent: "center",
  },

  serviceTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#202020",
    lineHeight: 21,
  },

  servicePrice: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1677FF",
    marginTop: 7,
  },

  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#F2F7FD",
  },

  serviceCategory: {
    fontSize: 12,
    color: "#5E6B7A",
    marginLeft: 5,
    maxWidth: 115,
  },

  arrowContainer: {
    width: 35,
    height: 35,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF3FF",
  },

  notFoundContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  notFoundBackButton: {
    position: "absolute",
    top: 58,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F5F8FC",
    alignItems: "center",
    justifyContent: "center",
  },

  notFoundText: {
    fontSize: 16,
    color: "#777777",
    marginTop: 12,
  },

  emptyContainer: {
    alignItems: "center",
    paddingTop: 35,
  },

  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2F7FD",
  },

  emptyText: {
    marginTop: 12,
    fontSize: 15,
    color: "#888888",
  },
});