import { useServices } from "@/src/contexts/ServiceContext";
import { useUser } from "@/src/contexts/UserContext";
import { startConversation } from "@/src/services/chat";
import { Ionicons } from "@expo/vector-icons";
import {
  router,
  useLocalSearchParams,
} from "expo-router";

import { useRef, useState } from "react";

import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const {
  width: screenWidth,
  height: screenHeight,
} = Dimensions.get("window");

const attendanceLabels = {
  local: "Atendimento no local",
  domicilio: "Atendimento em domicílio",
  online: "Atendimento online",
};

export default function ServiceDetails() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const { services } = useServices();
  const { user } = useUser();

  const [isOpeningChat, setIsOpeningChat] =
  useState(false);

  const imagesListRef =
    useRef<FlatList<string>>(null);

  const fullscreenListRef =
    useRef<FlatList<string>>(null);

  const [currentImage, setCurrentImage] =
    useState(0);

  const [fullscreenImage, setFullscreenImage] =
    useState(0);

  const [showFullscreen, setShowFullscreen] =
    useState(false);

  const service = services.find(
    (item) => item.id === id
  );

  function handleImageScroll(
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) {
    const index = Math.round(
      event.nativeEvent.contentOffset.x /
        screenWidth
    );

    setCurrentImage(index);
  }

  function handleFullscreenScroll(
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) {
    const index = Math.round(
      event.nativeEvent.contentOffset.x /
        screenWidth
    );

    setFullscreenImage(index);
  }

  function goToImage(index: number) {
    if (!service) {
      return;
    }

    if (
      index < 0 ||
      index >= service.images.length
    ) {
      return;
    }

    setCurrentImage(index);

    imagesListRef.current?.scrollToIndex({
      index,
      animated: true,
    });
  }

  function goToFullscreenImage(index: number) {
    if (!service) {
      return;
    }

    if (
      index < 0 ||
      index >= service.images.length
    ) {
      return;
    }

    setFullscreenImage(index);

    fullscreenListRef.current?.scrollToIndex({
      index,
      animated: true,
    });
  }

  function openFullscreen(index: number) {
    setFullscreenImage(index);
    setShowFullscreen(true);

    setTimeout(() => {
      fullscreenListRef.current?.scrollToIndex({
        index,
        animated: false,
      });
    }, 100);
  }

  function closeFullscreen() {
    setShowFullscreen(false);
    setCurrentImage(fullscreenImage);

    setTimeout(() => {
      imagesListRef.current?.scrollToIndex({
        index: fullscreenImage,
        animated: false,
      });
    }, 100);
  }

  async function handleOpenChat() {
  if (!service) {
    return;
  }

  if (!user) {
    Alert.alert(
      "Entre na sua conta",
      "Você precisa estar conectado para iniciar uma conversa."
    );

    return;
  }

  if (service.userId === user.id) {
    Alert.alert(
      "Este anúncio é seu",
      "Você não pode iniciar uma conversa com você mesmo."
    );

    return;
  }

  try {
    setIsOpeningChat(true);

    const conversationId =
    await startConversation({
    serviceId: service.id,
    serviceTitle: service.title,
    serviceImage: service.images[0] || "",

    customerId: user.id,
    customerName: user.name,
    customerPhoto: user.photoURL,

    ownerId: service.userId,
    ownerName: service.userName,
    ownerPhoto: service.userPhoto,
  });

    router.push({
      pathname: "/chat/[id]",
      params: {
        id: conversationId,
      },
    });
  } catch (error) {
    console.log(
      "Erro ao abrir conversa:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível iniciar a conversa.";

    if (Platform.OS === "web") {
      window.alert(message);
    } else {
      Alert.alert(
        "Erro ao conversar",
        message
      );
    }
  } finally {
    setIsOpeningChat(false);
  }
}

  if (!service) {
    return (
      <View style={styles.notFoundContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={60}
          color="#777777"
        />

        <Text style={styles.notFoundTitle}>
          Serviço não encontrado
        </Text>

        <Text style={styles.notFoundDescription}>
          Este anúncio pode ter sido removido.
        </Text>

        <Pressable
          style={styles.backHomeButton}
          onPress={() =>
            router.replace("/(tabs)")
          }
        >
          <Text style={styles.backHomeText}>
            Voltar para a Home
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.scrollContent
        }
      >
        <View style={styles.imageSection}>
          <FlatList
            ref={imagesListRef}
            data={service.images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(image, index) =>
              `${image}-${index}`
            }
            onMomentumScrollEnd={
              handleImageScroll
            }
            getItemLayout={(_, index) => ({
              length: screenWidth,
              offset: screenWidth * index,
              index,
            })}
            renderItem={({ item, index }) => (
              <Pressable
                onPress={() =>
                  openFullscreen(index)
                }
              >
                <Image
                  source={{ uri: item }}
                  style={styles.image}
                />

                <View
                  style={styles.expandInformation}
                >
                  <Ionicons
                    name="expand-outline"
                    size={18}
                    color="#FFFFFF"
                  />

                  <Text
                    style={
                      styles.expandInformationText
                    }
                  >
                    Ver foto
                  </Text>
                </View>
              </Pressable>
            )}
          />

          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color="#FFFFFF"
            />
          </Pressable>

          <View style={styles.imageCounter}>
            <Ionicons
              name="images-outline"
              size={16}
              color="#FFFFFF"
            />

            <Text style={styles.imageCounterText}>
              {currentImage + 1}/
              {service.images.length}
            </Text>
          </View>

          {service.images.length > 1 && (
            <>
              <Pressable
                style={[
                  styles.imageArrow,
                  styles.leftImageArrow,
                  currentImage === 0 &&
                    styles.disabledArrow,
                ]}
                onPress={() =>
                  goToImage(currentImage - 1)
                }
                disabled={currentImage === 0}
              >
                <Ionicons
                  name="chevron-back"
                  size={28}
                  color="#FFFFFF"
                />
              </Pressable>

              <Pressable
                style={[
                  styles.imageArrow,
                  styles.rightImageArrow,
                  currentImage ===
                    service.images.length - 1 &&
                    styles.disabledArrow,
                ]}
                onPress={() =>
                  goToImage(currentImage + 1)
                }
                disabled={
                  currentImage ===
                  service.images.length - 1
                }
              >
                <Ionicons
                  name="chevron-forward"
                  size={28}
                  color="#FFFFFF"
                />
              </Pressable>

              <View style={styles.dotsContainer}>
                {service.images.map(
                  (_, index) => (
                    <Pressable
                      key={index}
                      style={[
                        styles.dot,
                        currentImage === index &&
                          styles.activeDot,
                      ]}
                      onPress={() =>
                        goToImage(index)
                      }
                    />
                  )
                )}
              </View>
            </>
          )}
        </View>

        <View style={styles.information}>
          <Text style={styles.price}>
            {service.price}
          </Text>

          <Text style={styles.title}>
            {service.title}
          </Text>

          <View style={styles.categoryBadge}>
            <Ionicons
              name="pricetag-outline"
              size={15}
              color="#1677FF"
            />

            <Text style={styles.categoryText}>
              {service.category}
            </Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>
            Descrição
          </Text>

          <Text style={styles.description}>
            {service.description}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>
            Localização
          </Text>

          <View style={styles.informationRow}>
            <Ionicons
              name="location-outline"
              size={22}
              color="#1677FF"
            />

            <View style={styles.rowTextContainer}>
              <Text style={styles.rowTitle}>
                {service.city}
              </Text>

              <Text style={styles.rowDescription}>
                Bairro {service.neighborhood}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>
            Tipo de atendimento
          </Text>

          {service.attendance.map(
            (attendanceType) => (
              <View
                key={attendanceType}
                style={styles.attendanceOption}
              >
                <View
                  style={styles.attendanceIcon}
                >
                  <Ionicons
                    name={
                      attendanceType === "local"
                        ? "storefront-outline"
                        : attendanceType ===
                            "domicilio"
                          ? "home-outline"
                          : "videocam-outline"
                    }
                    size={20}
                    color="#1677FF"
                  />
                </View>

                <Text
                  style={styles.attendanceText}
                >
                  {
                    attendanceLabels[
                      attendanceType
                    ]
                  }
                </Text>
              </View>
            )
          )}

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>
            Publicado por
          </Text>

         <View style={styles.userCard}>
  {service.userPhoto ? (
  <View style={styles.avatar}>
    <Image
      source={{ uri: service.userPhoto }}
      style={styles.avatarImage}
    />
  </View>
) : (
  <View style={styles.avatar}>
    <Text style={styles.avatarText}>
      {service.userName.charAt(0).toUpperCase()}
    </Text>
  </View>
)}
            <View style={styles.userInformation}>
              <Text style={styles.userName}>
                {service.userName}
              </Text>

              <Text style={styles.userDescription}>
                Anunciante no ServiçoJá
              </Text>
            </View>
          </View>

          <View
            style={styles.whatsappInformation}
          >
            <Ionicons
              name="logo-whatsapp"
              size={21}
              color="#25D366"
            />

            <Text style={styles.whatsappText}>
              {service.whatsapp}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <Pressable
  style={[
    styles.whatsappButton,
    isOpeningChat &&
      styles.disabledChatButton,
  ]}
  onPress={handleOpenChat}
  disabled={isOpeningChat}
>
  <Ionicons
    name="chatbubble-ellipses"
    size={23}
    color="#FFFFFF"
  />

  <Text style={styles.whatsappButtonText}>
    {isOpeningChat
      ? "Abrindo conversa..."
      : "Conversar"}
  </Text>
</Pressable>
      </View>

      <Modal
        visible={showFullscreen}
        animationType="fade"
        transparent={false}
        onRequestClose={closeFullscreen}
      >
        <View style={styles.fullscreenContainer}>
          <FlatList
            ref={fullscreenListRef}
            data={service.images}
            style={styles.fullscreenList}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(image, index) =>
              `fullscreen-${image}-${index}`
            }
            onMomentumScrollEnd={
              handleFullscreenScroll
            }
            getItemLayout={(_, index) => ({
              length: screenWidth,
              offset: screenWidth * index,
              index,
            })}
            renderItem={({ item }) => (
              <View
                style={styles.fullscreenImagePage}
              >
                <Image
                  source={{ uri: item }}
                  style={styles.fullscreenImage}
                  resizeMode="contain"
                />
              </View>
            )}
          />

          <Pressable
            style={styles.closeFullscreenButton}
            onPress={closeFullscreen}
          >
            <Ionicons
              name="close"
              size={30}
              color="#FFFFFF"
            />
          </Pressable>

          <View
            style={styles.fullscreenCounter}
          >
            <Text
              style={styles.fullscreenCounterText}
            >
              {fullscreenImage + 1}/
              {service.images.length}
            </Text>
          </View>

          {service.images.length > 1 && (
            <>
              <Pressable
                style={[
                  styles.fullscreenArrow,
                  styles.fullscreenLeftArrow,
                  fullscreenImage === 0 &&
                    styles.disabledArrow,
                ]}
                onPress={() =>
                  goToFullscreenImage(
                    fullscreenImage - 1
                  )
                }
                disabled={fullscreenImage === 0}
              >
                <Ionicons
                  name="chevron-back"
                  size={38}
                  color="#FFFFFF"
                />
              </Pressable>

              <Pressable
                style={[
                  styles.fullscreenArrow,
                  styles.fullscreenRightArrow,
                  fullscreenImage ===
                    service.images.length - 1 &&
                    styles.disabledArrow,
                ]}
                onPress={() =>
                  goToFullscreenImage(
                    fullscreenImage + 1
                  )
                }
                disabled={
                  fullscreenImage ===
                  service.images.length - 1
                }
              >
                <Ionicons
                  name="chevron-forward"
                  size={38}
                  color="#FFFFFF"
                />
              </Pressable>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  scrollContent: {
    paddingBottom: 115,
  },

  imageSection: {
    position: "relative",
    backgroundColor: "#E7E7E7",
  },

  image: {
    width: screenWidth,
    height: 360,
    resizeMode: "cover",
  },

  expandInformation: {
    position: "absolute",
    right: 16,
    bottom: 16,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.62)",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  expandInformationText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  backButton: {
    position: "absolute",
    top: 48,
    left: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0, 0, 0, 0.58)",
    alignItems: "center",
    justifyContent: "center",
  },

  imageCounter: {
    position: "absolute",
    top: 51,
    right: 16,
    height: 35,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.58)",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  imageCounterText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  imageArrow: {
    position: "absolute",
    top: 160,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    alignItems: "center",
    justifyContent: "center",
  },

  leftImageArrow: {
    left: 12,
  },

  rightImageArrow: {
    right: 12,
  },

  disabledArrow: {
    opacity: 0.25,
  },

  dotsContainer: {
    position: "absolute",
    bottom: 15,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 7,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor:
      "rgba(255, 255, 255, 0.55)",
  },

  activeDot: {
    width: 22,
    backgroundColor: "#FFFFFF",
  },

  information: {
    paddingHorizontal: 20,
    paddingTop: 22,
  },

  price: {
    fontSize: 27,
    fontWeight: "900",
    color: "#1677FF",
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#202020",
    lineHeight: 31,
    marginTop: 7,
  },

  categoryBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EAF3FF",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 14,
  },

  categoryText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1677FF",
  },

  divider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginVertical: 24,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#222222",
    marginBottom: 13,
  },

  description: {
    fontSize: 16,
    color: "#555555",
    lineHeight: 25,
  },

  informationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  rowTextContainer: {
    flex: 1,
  },

  rowTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#282828",
  },

  rowDescription: {
    fontSize: 14,
    color: "#707070",
    marginTop: 4,
  },

  attendanceOption: {
    minHeight: 54,
    borderRadius: 13,
    backgroundColor: "#F4F8FF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    marginBottom: 9,
  },

  attendanceIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E0EDFF",
    alignItems: "center",
    justifyContent: "center",
  },

  attendanceText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#353535",
    marginLeft: 11,
  },

  userCard: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
  width: 55,
  height: 55,
  borderRadius: 28,
  backgroundColor: "#1677FF",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
},
avatarImage: {
  width: "100%",
  height: "100%",
  borderRadius: 28,
  resizeMode: "cover",
},

  avatarText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  userInformation: {
    marginLeft: 13,
    flex: 1,
  },

  userName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#252525",
  },

  userDescription: {
    fontSize: 13,
    color: "#777777",
    marginTop: 4,
  },

  whatsappInformation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 17,
  },

  whatsappText: {
    fontSize: 15,
    color: "#555555",
  },

  bottomContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "#EAEAEA",
  },

  whatsappButton: {
    height: 57,
    borderRadius: 15,
    backgroundColor: "#25D366",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  whatsappButtonText: {
  color: "#FFFFFF",
  fontSize: 17,
  fontWeight: "800",
},

  disabledChatButton: {
    opacity: 0.65,
  },


  fullscreenContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },

  fullscreenList: {
  flex: 1,
  width: screenWidth,
  height: screenHeight,
},

fullscreenImagePage: {
  width: screenWidth,
  height: screenHeight,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#000000",
},

fullscreenImage: {
  width: screenWidth,
  height: screenHeight,
},

  closeFullscreenButton: {
    position: "absolute",
    top: Platform.OS === "web" ? 20 : 48,
    left: 18,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(40, 40, 40, 0.8)",
    alignItems: "center",
    justifyContent: "center",
  },

  fullscreenCounter: {
    position: "absolute",
    top: Platform.OS === "web" ? 24 : 53,
    alignSelf: "center",
    backgroundColor: "rgba(40, 40, 40, 0.8)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  fullscreenCounterText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  fullscreenArrow: {
    position: "absolute",
    top: "47%",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(40, 40, 40, 0.75)",
    alignItems: "center",
    justifyContent: "center",
  },

  fullscreenLeftArrow: {
    left: 18,
  },

  fullscreenRightArrow: {
    right: 18,
  },

  notFoundContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  notFoundTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#262626",
    marginTop: 15,
  },

  notFoundDescription: {
    fontSize: 15,
    color: "#777777",
    marginTop: 7,
    textAlign: "center",
  },

  backHomeButton: {
    height: 52,
    borderRadius: 13,
    backgroundColor: "#1677FF",
    paddingHorizontal: 25,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 25,
  },

  backHomeText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});