import { CategoryCard } from "@/src/components/CategoryCard";
import { SearchInput } from "@/src/components/SearchInput";
import { ServiceCard } from "@/src/components/ServiceCard";

import { useServices } from "@/src/contexts/ServiceContext";
import { useUser } from "@/src/contexts/UserContext";

import { categories } from "@/src/data/categories";
import { colors } from "@/src/theme/colors";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Dimensions,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

const CAROUSEL_GAP = 14;
const CAROUSEL_WIDTH = width;

const carouselItems = [
  {
    id: "1",
    title: "Anuncie aqui",
    description:
      "Divulgue sua empresa e alcance mais clientes no ServiçoJá.",
    button: "Quero anunciar",
  },
  {
    id: "2",
    title: "Anuncie aqui",
    description:
      "Mostre sua empresa para pessoas que estão procurando serviços.",
    button: "Quero anunciar",
  },
  {
    id: "3",
    title: "Anuncie aqui",
    description:
      "Destaque sua marca e conquiste novos clientes.",
    button: "Quero anunciar",
  },
  {
    id: "4",
    title: "Anuncie aqui",
    description:
      "Seu negócio pode aparecer em destaque para nossos usuários.",
    button: "Quero anunciar",
  },
  {
    id: "5",
    title: "Anuncie aqui",
    description:
      "Divulgue sua empresa no ServiçoJá.",
    button: "Quero anunciar",
  },
];

const infiniteCarouselItems = [
  carouselItems[carouselItems.length - 1],
  ...carouselItems,
  carouselItems[0],
];

export default function Home() {
  const [search, setSearch] = useState("");

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState<string | null>(null);

  const [carouselIndex, setCarouselIndex] =
    useState(1);

  const [refreshing, setRefreshing] =
    useState(false);

    const [menuVisible, setMenuVisible] =
  useState(false);

  const [servicesOrder, setServicesOrder] =
    useState<string[]>([]);

  const carouselRef = useRef<ScrollView>(null);

  const { user } = useUser();
  const { services } = useServices();

  function shuffleServices() {
    const shuffledIds = [...services]
      .sort(() => Math.random() - 0.5)
      .map((service) => service.id);

    setServicesOrder(shuffledIds);
  }

  useEffect(() => {
    if (services.length === 0) {
      setServicesOrder([]);
      return;
    }

    shuffleServices();
  }, [services.length]);

  async function handleRefresh() {
    setRefreshing(true);

    shuffleServices();

    await new Promise((resolve) =>
      setTimeout(resolve, 700)
    );

    setRefreshing(false);
  }

  const orderedServices = useMemo(() => {
    if (servicesOrder.length === 0) {
      return services;
    }

    const servicesMap = new Map(
      services.map((service) => [
        service.id,
        service,
      ])
    );

    const ordered = servicesOrder.reduce<
      typeof services
    >((result, id) => {
      const service = servicesMap.get(id);

      if (service) {
        result.push(service);
      }

      return result;
    }, []);

    const orderedIds = new Set(
      ordered.map((service) => service.id)
    );

    const newServices = services.filter(
      (service) =>
        !orderedIds.has(service.id)
    );

    return [
      ...ordered,
      ...newServices,
    ];
  }, [services, servicesOrder]);

  const filteredServices = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return orderedServices.filter((service) => {
      const matchesSearch =
        !normalizedSearch ||
        service.title
          .toLowerCase()
          .includes(normalizedSearch) ||
        service.description
          .toLowerCase()
          .includes(normalizedSearch) ||
        service.category
          .toLowerCase()
          .includes(normalizedSearch) ||
        service.city
          .toLowerCase()
          .includes(normalizedSearch) ||
        service.neighborhood
          .toLowerCase()
          .includes(normalizedSearch) ||
        service.userName
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesCategory =
        !selectedCategory ||
        service.category === selectedCategory;

      return (
        matchesSearch &&
        matchesCategory
      );
    });
  }, [
    search,
    selectedCategory,
    orderedServices,
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((currentIndex) => {
        const nextIndex =
          currentIndex + 1;

        carouselRef.current?.scrollTo({
          x:
            nextIndex *
            CAROUSEL_WIDTH,
          animated: true,
        });

        return nextIndex;
      });
    }, 4000);

    return () =>
      clearInterval(interval);
  }, []);

  function handleCarouselMomentumEnd(
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) {
    const offsetX =
      event.nativeEvent.contentOffset.x;

    const index = Math.round(
      offsetX / CAROUSEL_WIDTH
    );

    if (index === 0) {
      setCarouselIndex(
        carouselItems.length
      );

      requestAnimationFrame(() => {
        carouselRef.current?.scrollTo({
          x:
            carouselItems.length *
            CAROUSEL_WIDTH,
          animated: false,
        });
      });

      return;
    }

    if (
      index ===
      infiniteCarouselItems.length - 1
    ) {
      setCarouselIndex(1);

      requestAnimationFrame(() => {
        carouselRef.current?.scrollTo({
          x: CAROUSEL_WIDTH,
          animated: false,
        });
      });

      return;
    }

    setCarouselIndex(index);
  }

  useEffect(() => {
    if (
      carouselIndex >
      carouselItems.length
    ) {
      setCarouselIndex(1);

      requestAnimationFrame(() => {
        carouselRef.current?.scrollTo({
          x: CAROUSEL_WIDTH,
          animated: false,
        });
      });
    }
  }, [carouselIndex]);

  return (
    <View style={styles.container}>
      <View style={styles.fixedHeader}>
        <View style={styles.header}>
          {user ? (
            <>
              <Pressable
                style={styles.userInfo}
                onPress={() =>
                  router.push(
                    "/(tabs)/perfil"
                  )
                }
              >
                {user.photoURL ? (
                  <Image
                    source={{
                      uri: user.photoURL,
                    }}
                    style={styles.avatar}
                  />
                ) : (
                  <View
                    style={
                      styles.avatarPlaceholder
                    }
                  >
                    <Text
                      style={
                        styles.avatarPlaceholderText
                      }
                    >
                      {user.name
                        ?.charAt(0)
                        .toUpperCase() || "U"}
                    </Text>
                  </View>
                )}

                <Text style={styles.greeting}>
                  Olá,{" "}
                  <Text style={styles.userName}>
                    {user.name?.split(
                      " "
                    )[0] || "usuário"}
                  </Text>
                </Text>
              </Pressable>

              <Pressable
                style={styles.menuButton}
                onPress={() =>
                  setMenuVisible(true)
                }
              >
                <Ionicons
                  name="menu-outline"
                  size={28}
                  color={colors.black}
                />
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.greeting}>
                ServiçoJá
              </Text>

              <Pressable
                style={styles.loginButton}
                onPress={() =>
                  router.push(
                    "/(auth)/login"
                  )
                }
              >
                <Text
                  style={
                    styles.loginButtonText
                  }
                >
                  Entrar
                </Text>
              </Pressable>
            </>
          )}
        </View>

        <View style={styles.searchSection}>
          <SearchInput
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#1677FF"]}
            tintColor="#1677FF"
          />
        }
      >
        <View style={styles.carouselSection}>
          <ScrollView
            ref={carouselRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={
              false
            }
            onMomentumScrollEnd={
              handleCarouselMomentumEnd
            }
            contentOffset={{
              x: CAROUSEL_WIDTH,
              y: 0,
            }}
          >
            {infiniteCarouselItems.map(
              (item, index) => (
                <View
                  key={`${item.id}-${index}`}
                  style={
                    styles.carouselPage
                  }
                >
                  <View
                    style={
                      styles.carouselCard
                    }
                  >
                    <View
                      style={
                        styles.carouselDecoration
                      }
                    />

                    <View
                      style={
                        styles.carouselTextContent
                      }
                    >
                      <Text
                        style={
                          styles.carouselTitle
                        }
                      >
                        {item.title}
                      </Text>

                      <Text
                        style={
                          styles.carouselDescription
                        }
                      >
                        {item.description}
                      </Text>

                      <Pressable
                        style={
                          styles.carouselButton
                        }
                      >
                        <Text
                          style={
                            styles.carouselButtonText
                          }
                        >
                          {item.button}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              )
            )}
          </ScrollView>

          <View
            style={
              styles.dotsContainer
            }
          >
            {carouselItems.map(
              (_, index) => {
                const activeIndex =
                  carouselIndex === 0
                    ? carouselItems.length - 1
                    : carouselIndex ===
                      carouselItems.length + 1
                    ? 0
                    : carouselIndex - 1;

                return (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      activeIndex ===
                        index &&
                        styles.activeDot,
                    ]}
                  />
                );
              }
            )}
          </View>
        </View>

        <View
          style={styles.sectionHeader}
        >
          <Text
            style={styles.sectionTitle}
          >
            Categorias
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.categoriesContainer
          }
        >
          {categories.map(
            (category) => {
              const isSelected =
                selectedCategory ===
                category.name;

              return (
                <View
                  key={category.id}
                  style={[
                    styles.categoryWrapper,
                    isSelected &&
                      styles.selectedCategory,
                  ]}
                >
                  <CategoryCard
                    name={category.name}
                    icon={category.icon}
                    onPress={() => {
                      setSelectedCategory(
                        isSelected
                          ? null
                          : category.name
                      );
                    }}
                  />
                </View>
              );
            }
          )}
        </ScrollView>

        <View
          style={styles.servicesHeader}
        >
          <Text
            style={styles.sectionTitle}
          >
            Serviços disponíveis
          </Text>
        </View>

        {filteredServices.length > 0 ? (
          <View
            style={styles.servicesGrid}
          >
            {filteredServices.map(
              (service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                />
              )
            )}
          </View>
        ) : (
          <View
            style={
              styles.emptyContainer
            }
          >
            <Text
              style={styles.emptyIcon}
            >
              🔎
            </Text>

            <Text
              style={styles.emptyTitle}
            >
              Nenhum serviço encontrado
            </Text>

            <Text
              style={
                styles.emptyDescription
              }
            >
              Publique um serviço ou tente
              pesquisar por outro termo.
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={styles.homeMenuOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <Pressable
            style={styles.homeMenu}
            onPress={(event) => event.stopPropagation()}
          >
            <Pressable
              style={styles.homeMenuOption}
              onPress={() => {
                setMenuVisible(false);
                router.push("/settings");
              }}
            >
              <Ionicons
                name="settings-outline"
                size={22}
                color={colors.black}
              />
              <Text style={styles.homeMenuOptionText}>
                Configurações
              </Text>
            </Pressable>

            <View style={styles.homeMenuDivider} />

            <Pressable
              style={styles.homeMenuOption}
              onPress={() => {
                setMenuVisible(false);
                router.push("/notifications");
              }}
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                color={colors.black}
              />
              <Text style={styles.homeMenuOptionText}>
                Notificações
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  fixedHeader: {
    backgroundColor: colors.background,
    paddingTop: 28,
    borderTopWidth: 1,
    borderTopColor: "#E7E7E7",
    borderBottomWidth: 1,
    borderBottomColor: "#E7E7E7",
    zIndex: 10,
    elevation: 4,
  },

  header: {
    height: 82,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  userInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "#1677FF",
  },

  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#1677FF",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarPlaceholderText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  greeting: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.black,
  },

  userName: {
    color: "#1677FF",
  },

  menuButton: {
    width: 45,
    height: 45,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  loginButton: {
    backgroundColor: "#1677FF",
    paddingHorizontal: 20,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  searchSection: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 2,
  },

  scrollView: {
    flex: 1,
  },

  content: {
    paddingTop: 18,
    paddingBottom: 120,
  },

  carouselSection: {
    marginTop: 0,
  },

  carouselPage: {
    width: CAROUSEL_WIDTH,
  },

  carouselCard: {
    width:
      CAROUSEL_WIDTH -
      CAROUSEL_GAP * 2,
    height: 185,
    borderRadius: 22,
    backgroundColor: "#1677FF",
    overflow: "hidden",
    position: "relative",
    marginHorizontal: CAROUSEL_GAP,
  },

  carouselDecoration: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor:
      "rgba(255,255,255,0.08)",
    right: -80,
    top: -45,
  },

  carouselTextContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingVertical: 20,
    width: "72%",
  },

  carouselTitle: {
    fontSize: 23,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 29,
    marginBottom: 10,
  },

  carouselDescription: {
    fontSize: 14,
    color: "#E4EEFF",
    lineHeight: 20,
    marginBottom: 16,
  },

  carouselButton: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    height: 39,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  carouselButtonText: {
    color: "#1677FF",
    fontSize: 13,
    fontWeight: "800",
  },

  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 10,
    backgroundColor: "#C9D4E4",
  },

  activeDot: {
    width: 20,
    backgroundColor: "#1677FF",
  },

  sectionHeader: {
    paddingHorizontal: 16,
    marginTop: 27,
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: colors.black,
  },

  categoriesContainer: {
    paddingLeft: 16,
    paddingRight: 20,
    paddingTop: 16,
    gap: 10,
  },

  categoryWrapper: {
    borderRadius: 15,
  },

  selectedCategory: {
    borderWidth: 2,
    borderColor: "#1677FF",
  },

  servicesHeader: {
    paddingHorizontal: 16,
    marginTop: 30,
    marginBottom: 16,
  },

  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 0,
    columnGap: 0,
  },

  emptyContainer: {
    alignItems: "center",
    paddingVertical: 55,
    paddingHorizontal: 25,
  },

  emptyIcon: {
    fontSize: 42,
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.black,
  },

  emptyDescription: {
    marginTop: 7,
    fontSize: 14,
    color: colors.gray600,
    textAlign: "center",
    lineHeight: 20,
  },

  homeMenuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 90,
    paddingRight: 16,
  },

  homeMenu: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 6,
    width: 200,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  homeMenuOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  homeMenuOptionText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.black,
  },

  homeMenuDivider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginHorizontal: 12,
  },
});
