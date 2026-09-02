import { useServices } from "@/src/contexts/ServiceContext";
import { useUser } from "@/src/contexts/UserContext";
import { startConversation } from "@/src/services/chat";
import { db } from "@/src/services/firebase";
import { Ionicons } from "@expo/vector-icons";
import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
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
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: screenWidth } = Dimensions.get("window");

const attendanceLabels = {
  local: "Atendimento no local",
  domicilio: "Atendimento a domicílio",
  online: "Atendimento online",
};

export default function ServiceDetails() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const router = useRouter();

  const { getServiceById } = useServices();
  const { user } = useUser();

  // Detecta automaticamente o espaço ocupado
  // pelos botões ou pela área de gestos do celular
  const insets = useSafeAreaInsets();

  const service = getServiceById(id);

  const [currentImage, setCurrentImage] = useState(0);

  const [fullscreenImage, setFullscreenImage] =
    useState(0);

  const [showFullscreen, setShowFullscreen] =
    useState(false);

  const [isOpeningChat, setIsOpeningChat] =
    useState(false);

    const [serviceMenuVisible, setServiceMenuVisible] =
  useState(false);

const [reportMenuVisible, setReportMenuVisible] =
  useState(false);

  const [selectedReportReason, setSelectedReportReason] =
  useState("");

const [reportDescription, setReportDescription] =
  useState("");

const [sendingReport, setSendingReport] =
  useState(false);

  const imagesListRef =
    useRef<FlatList<string>>(null);

  const fullscreenListRef =
    useRef<FlatList<string>>(null);

  function handleImageScroll(
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) {
    const index = Math.round(
      event.nativeEvent.contentOffset.x / screenWidth
    );

    setCurrentImage(index);
  }

  function handleFullscreenScroll(
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) {
    const index = Math.round(
      event.nativeEvent.contentOffset.x / screenWidth
    );

    setFullscreenImage(index);
  }

  function goToImage(index: number) {
    if (!service) return;

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
    if (!service) return;

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

 function handleViewProfile() {
  if (!service) return;


  if (user?.id === service.userId) {
    router.push("/perfil");
    return;
  }
  router.push({
    pathname: "/profile/[id]",
    params: {
      id: service.userId,
    },
  });
}

async function handleReportService(reason: string) {
  if (!user?.id) {
    Alert.alert(
      "Entre na sua conta",
      "Você precisa estar conectado para denunciar um serviço."
    );
    return;
  }

  if (!service) {
    return;
  }

  if (user.id === service.userId) {
    Alert.alert(
      "Ação inválida",
      "Você não pode denunciar o seu próprio serviço."
    );
    return;
  }

  try {
    const existingReportQuery = query(
      collection(db, "reports"),
      where("reporterId", "==", user.id),
      where("serviceId", "==", service.id),
      where("type", "==", "service")
    );

    const existingReportSnapshot =
      await getDocs(existingReportQuery);

    console.log(
      "DENÚNCIAS ENCONTRADAS:",
      existingReportSnapshot.size
    );

    if (!existingReportSnapshot.empty) {
      Alert.alert(
        "Denúncia já enviada",
        "Você já denunciou este serviço."
      );
      return;
    }

    await addDoc(collection(db, "reports"), {
      reporterId: user.id,
      reportedUserId: service.userId,
      serviceId: service.id,
      type: "service",
      reason,
      description:
        reportDescription.trim() || null,
      status: "pending",
      createdAt: serverTimestamp(),
    });

    Alert.alert(
      "Denúncia enviada",
      "Obrigado por nos avisar. Vamos analisar este anúncio."
    );
  } catch (error) {
    console.log(
      "Erro ao denunciar serviço:",
      error
    );

    Alert.alert(
      "Erro",
      "Não foi possível enviar a denúncia. Tente novamente."
    );
  }
}

  async function handleOpenChat() {
    if (!service) return;

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
          onPress={() => router.back()}
        >
          <Text style={styles.backHomeButtonText}>
            Voltar
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom:
              90 +
              Math.max(insets.bottom, 12),
          },
        ]}
      >
        <View style={styles.imageContainer}>
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
              </Pressable>
            )}
          />

          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={25}
              color="#202020"
            />
          </Pressable>

         <Pressable
  style={styles.reportServiceButton}
  onPress={() => setServiceMenuVisible(true)}
>
  <Ionicons
    name="ellipsis-vertical"
    size={23}
    color="#202020"
  />
</Pressable>

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
                {service.images.map((_, index) => (
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
                ))}
              </View>
            </>
          )}
        </View>

        <View style={styles.information}>
          <Text style={styles.title}>
            {service.title}
          </Text>

          <Text style={styles.price}>
            R$ {service.price}
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
                <View style={styles.attendanceIcon}>
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

                <Text style={styles.attendanceText}>
                  {attendanceLabels[attendanceType]}
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
              <Image
                source={{
                  uri: service.userPhoto,
                }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {service.userName
                    .charAt(0)
                    .toUpperCase()}
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

            <Pressable
              style={styles.viewProfileButton}
              onPress={handleViewProfile}
            >
              <Text
                style={styles.viewProfileButtonText}
              >
                Ver perfil
              </Text>

              <Ionicons
                name="chevron-forward"
                size={17}
                color="#1677FF"
              />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* BOTÃO ADAPTÁVEL À NAVEGAÇÃO DO CELULAR */}
      <View
        style={[
          styles.bottomContainer,
          {
            paddingBottom:
              insets.bottom > 0
                ? insets.bottom
                : 12,
          },
        ]}
      >
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
        visible={serviceMenuVisible}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setServiceMenuVisible(false)
        }
      >
        <Pressable
          style={styles.menuOverlay}
          onPress={() =>
            setServiceMenuVisible(false)
          }
        >
          <Pressable
            style={styles.serviceMenu}
            onPress={(event) =>
              event.stopPropagation()
            }
          >
            <View style={styles.menuHandle} />

            <Text style={styles.menuTitle}>
              Opções do anúncio
            </Text>

            <Pressable
              style={styles.menuOption}
              onPress={() => {
                setServiceMenuVisible(false);

                setTimeout(() => {
                  setReportMenuVisible(true);
                }, 150);
              }}
            >
              <View style={styles.menuIconDanger}>
                <Ionicons
                  name="flag-outline"
                  size={22}
                  color="#E53935"
                />
              </View>

              <View
                style={
                  styles.menuOptionTextContainer
                }
              >
                <Text
                  style={styles.menuOptionTitle}
                >
                  Denunciar serviço
                </Text>

                <Text
                  style={
                    styles.menuOptionDescription
                  }
                >
                  Informar um problema com este anúncio
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color="#999999"
              />
            </Pressable>

            <Pressable
              style={styles.cancelMenuButton}
              onPress={() =>
                setServiceMenuVisible(false)
              }
            >
              <Text style={styles.cancelMenuText}>
                Cancelar
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
  visible={reportMenuVisible}
  transparent
  animationType="slide"
  onRequestClose={() => {
    setReportMenuVisible(false);
    setSelectedReportReason("");
    setReportDescription("");
  }}
>
  <Pressable
    style={styles.menuOverlay}
    onPress={() => {
      setReportMenuVisible(false);
      setSelectedReportReason("");
      setReportDescription("");
    }}
  >
    <Pressable
      style={styles.serviceMenu}
      onPress={(event) =>
        event.stopPropagation()
      }
    >
      <View style={styles.menuHandle} />

      <Text style={styles.menuTitle}>
        Denunciar serviço
      </Text>

      <Text style={styles.reportSubtitle}>
        Selecione o motivo da denúncia
      </Text>

      {[
        "Golpe ou fraude",
        "Conteúdo enganoso",
        "Conteúdo inadequado",
        "Serviço proibido",
        "Outro",
      ].map((reason) => (
        <Pressable
          key={reason}
          style={styles.reportOption}
          onPress={() => {
            setSelectedReportReason(reason);
          }}
        >
          <View
            style={[
              styles.reportOptionIcon,
              selectedReportReason === reason &&
                styles.reportOptionIconSelected,
            ]}
          >
            <Ionicons
              name={
                selectedReportReason === reason
                  ? "checkmark"
                  : "flag-outline"
              }
              size={19}
              color="#1677FF"
            />
          </View>

          <Text
            style={[
              styles.reportOptionText,
              selectedReportReason === reason &&
                styles.reportOptionTextSelected,
            ]}
          >
            {reason}
          </Text>

          {selectedReportReason === reason && (
            <Ionicons
              name="checkmark-circle"
              size={22}
              color="#1677FF"
            />
          )}
        </Pressable>
      ))}

      {selectedReportReason !== "" && (
        <>
          <Text style={styles.descriptionLabel}>
            Explique o que aconteceu{" "}
            <Text style={styles.optionalText}>
              (opcional)
            </Text>
          </Text>

          <View style={styles.reportInputContainer}>
            <TextInput
              style={styles.reportInput}
              placeholder="Conte mais detalhes sobre a denúncia..."
              placeholderTextColor="#999999"
              value={reportDescription}
              onChangeText={setReportDescription}
              multiline
              maxLength={500}
              textAlignVertical="top"
            />
          </View>

          <Text style={styles.characterCount}>
            {reportDescription.length}/500
          </Text>

          <Pressable
            style={[
              styles.confirmReportButton,
              sendingReport &&
                styles.disabledReportButton,
            ]}
            disabled={sendingReport}
            onPress={async () => {
              if (!selectedReportReason) {
                return;
              }

              try {
                setSendingReport(true);

                console.log(
  "DESCRIÇÃO DA DENÚNCIA:",
  reportDescription
);

                await handleReportService(
                  selectedReportReason
                );

                setReportMenuVisible(false);
                setSelectedReportReason("");
                setReportDescription("");
              } finally {
                setSendingReport(false);
              }
            }}
          >
            <Ionicons
              name="paper-plane-outline"
              size={20}
              color="#FFFFFF"
            />

            <Text style={styles.confirmReportText}>
              {sendingReport
                ? "Enviando..."
                : "Confirmar denúncia"}
            </Text>
          </Pressable>
        </>
      )}

      <Pressable
        style={styles.cancelMenuButton}
        onPress={() => {
          setReportMenuVisible(false);
          setSelectedReportReason("");
          setReportDescription("");
        }}
      >
        <Text style={styles.cancelMenuText}>
          Cancelar
        </Text>
      </Pressable>
    </Pressable>
  </Pressable>
</Modal>

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

          <View style={styles.fullscreenCounter}>
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
                  size={32}
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
                  size={32}
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

  scrollContent: {},

  imageContainer: {
  width: screenWidth,
  height: screenWidth,
  backgroundColor: "#EEEEEE",
},

image: {
  width: screenWidth,
  height: screenWidth,
  resizeMode: "cover",
},

  backButton: {
    position: "absolute",
    top: 48,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  reportServiceButton: {
  position: "absolute",
  top: 48,
  right: 16,
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: "#FFFFFF",
  alignItems: "center",
  justifyContent: "center",
},

  menuOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  serviceMenu: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
  },

  menuHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D6D6D6",
    alignSelf: "center",
    marginBottom: 20,
  },

  menuTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#202020",
    marginBottom: 18,
  },

  menuOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },

  menuIconDanger: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF0F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  menuOptionTextContainer: {
    flex: 1,
  },

  menuOptionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#202020",
  },

  menuOptionDescription: {
    fontSize: 13,
    color: "#777777",
    marginTop: 3,
  },

  cancelMenuButton: {
    height: 50,
    borderRadius: 13,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },

  cancelMenuText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#555555",
  },

  reportSubtitle: {
    fontSize: 14,
    color: "#777777",
    marginTop: -10,
    marginBottom: 10,
  },

  reportOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },

  reportOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EEF5FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  reportOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#333333",
  },

    reportOptionIconSelected: {
    backgroundColor: "#DCEBFF",
  },

  reportOptionTextSelected: {
    color: "#1677FF",
    fontWeight: "800",
  },

  descriptionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333333",
    marginTop: 14,
    marginBottom: 8,
  },

  optionalText: {
    color: "#999999",
    fontWeight: "500",
  },

  reportInputContainer: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    minHeight: 90,
  },

  reportInput: {
    minHeight: 90,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#333333",
  },

  characterCount: {
    textAlign: "right",
    fontSize: 11,
    color: "#999999",
    marginTop: 4,
  },

  confirmReportButton: {
    height: 50,
    borderRadius: 13,
    backgroundColor: "#1677FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    gap: 8,
  },

  disabledReportButton: {
    opacity: 0.6,
  },

  confirmReportText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  imageArrow: {
    position: "absolute",
    top: "50%",
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },

  leftImageArrow: {
    left: 14,
  },

  rightImageArrow: {
    right: 14,
  },

  disabledArrow: {
    opacity: 0.25,
  },

  dotsContainer: {
    position: "absolute",
    bottom: 14,
    alignSelf: "center",
    flexDirection: "row",
    gap: 7,
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.6)",
  },

  activeDot: {
    width: 20,
    backgroundColor: "#FFFFFF",
  },

  information: {
    paddingHorizontal: 20,
    paddingTop: 22,
  },

  title: {
    fontSize: 25,
    fontWeight: "800",
    color: "#202020",
    lineHeight: 32,
  },

  price: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1677FF",
    marginTop: 7,
  },

  categoryBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EEF5FF",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    marginTop: 15,
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
    fontSize: 18,
    fontWeight: "800",
    color: "#202020",
    marginBottom: 12,
  },

  description: {
    fontSize: 15,
    lineHeight: 23,
    color: "#666666",
  },

  informationRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  rowTextContainer: {
    marginLeft: 12,
  },

  rowTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#202020",
  },

  rowDescription: {
    fontSize: 14,
    color: "#777777",
    marginTop: 3,
  },

  attendanceOption: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  attendanceIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EEF5FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  attendanceText: {
    fontSize: 15,
    color: "#444444",
    fontWeight: "600",
  },

  userCard: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#1677FF",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EEEEEE",
  },

  avatarText: {
    fontSize: 21,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  userInformation: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },

  userName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#202020",
  },

  userDescription: {
    fontSize: 13,
    color: "#777777",
    marginTop: 3,
  },

  viewProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF5FF",
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 10,
  },

  viewProfileButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1677FF",
    marginRight: 2,
  },

  bottomContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  whatsappButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: "#1677FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  disabledChatButton: {
    opacity: 0.65,
  },

  whatsappButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    marginLeft: 9,
  },

  fullscreenContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },

  fullscreenImagePage: {
    width: screenWidth,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  fullscreenImage: {
    width: screenWidth,
    height: "100%",
  },

  closeFullscreenButton: {
    position: "absolute",
    top: 52,
    right: 18,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  fullscreenCounter: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },

  fullscreenCounterText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  fullscreenArrow: {
    position: "absolute",
    top: "50%",
    marginTop: -25,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  fullscreenLeftArrow: {
    left: 14,
  },

  fullscreenRightArrow: {
    right: 14,
  },

  notFoundContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },

  notFoundTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#202020",
    marginTop: 16,
  },

  notFoundDescription: {
    fontSize: 15,
    color: "#777777",
    textAlign: "center",
    marginTop: 8,
  },

  backHomeButton: {
    marginTop: 24,
    backgroundColor: "#1677FF",
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 12,
  },

  backHomeButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});