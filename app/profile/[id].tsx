import { useServices } from "@/src/contexts/ServiceContext";
import { useUser } from "@/src/contexts/UserContext";
import { createReport } from "@/src/services/report";

import { Service } from "@/src/types/Service";

import { Ionicons } from "@expo/vector-icons";

import { useLocalSearchParams, useRouter } from "expo-router";

import { useMemo, useState } from "react";

import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function PublicProfileScreen() {
  const { id } =
    useLocalSearchParams<{ id: string }>();

  const router = useRouter();

  const { services } = useServices();

  const { user } = useUser();

  const [menuVisible, setMenuVisible] =
    useState(false);

  const [reportModalVisible, setReportModalVisible] =
    useState(false);

  const [reportDescription, setReportDescription] =
    useState("");

  const [sendingReport, setSendingReport] =
    useState(false);

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

  async function handleReportUser(
    reason: string
  ) {
    if (!user?.id) {
      Alert.alert(
        "Erro",
        "Você precisa estar conectado para denunciar."
      );
      return;
    }

    if (user.id === id) {
      Alert.alert(
        "Ação inválida",
        "Você não pode denunciar a si mesmo."
      );
      return;
    }

    try {
      setSendingReport(true);

      await createReport({
        reporterId: user.id,
        reportedUserId: id,
        type: "user",
        reason,
        description:
          reportDescription.trim() ||
          undefined,
      });

      setReportModalVisible(false);
      setReportDescription("");

      Alert.alert(
        "Denúncia enviada",
        "Obrigado por nos informar. A denúncia será analisada pela equipe do ServiçoJá."
      );
    } catch (error) {
      console.log(
        "Erro ao denunciar usuário:",
        error
      );

      Alert.alert(
        "Erro",
        error instanceof Error
          ? error.message
          : "Não foi possível enviar a denúncia."
      );
    } finally {
      setSendingReport(false);
    }
  }

  function handleBlockUser() {
    if (!user?.id) {
      Alert.alert(
        "Erro",
        "Você precisa estar conectado para bloquear alguém."
      );
      return;
    }

    if (user.id === id) {
      return;
    }

    Alert.alert(
      "Bloquear usuário?",
      `Você não verá mais as interações desse usuário. Deseja continuar?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Bloquear",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Bloqueio",
              "A função de bloqueio será concluída na próxima etapa."
            );
          },
        },
      ]
    );
  }

  function openReportModal() {
    setMenuVisible(false);

    setTimeout(() => {
      setReportModalVisible(true);
    }, 200);
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
          pressed &&
            styles.serviceCardPressed,
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
        <View
          style={
            styles.serviceImageContainer
          }
        >
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

          <View
            style={
              styles.categoryContainer
            }
          >
            <Ionicons
              name="pricetag-outline"
              size={14}
              color="#1677FF"
            />

            <Text
              style={
                styles.serviceCategory
              }
              numberOfLines={1}
            >
              {item.category}
            </Text>
          </View>
        </View>

        <View
          style={styles.arrowContainer}
        >
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
        contentContainerStyle={
          styles.listContent
        }
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Pressable
                style={styles.headerButton}
                onPress={() =>
                  router.back()
                }
              >
                <Ionicons
                  name="arrow-back"
                  size={25}
                  color="#FFFFFF"
                />
              </Pressable>

              <Text
                style={styles.headerTitle}
              >
                Perfil
              </Text>

              <Pressable
                style={styles.headerButton}
                onPress={() =>
                  setMenuVisible(true)
                }
              >
                <Ionicons
                  name="ellipsis-vertical"
                  size={23}
                  color="#FFFFFF"
                />
              </Pressable>
            </View>

            <View
              style={styles.profileSection}
            >
              <View
                style={
                  styles.profileImageWrapper
                }
              >
                {userData.userPhoto ? (
                  <Image
                    source={{
                      uri: userData.userPhoto,
                    }}
                    style={
                      styles.profileImage
                    }
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

              <Text
                style={styles.userName}
              >
                {userData.userName}
              </Text>

              <View
                style={styles.statsCard}
              >
                <View
                  style={styles.statItem}
                >
                  <View
                    style={
                      styles.statIconBlue
                    }
                  >
                    <Ionicons
                      name="briefcase-outline"
                      size={23}
                      color="#1677FF"
                    />
                  </View>

                  <Text
                    style={
                      styles.statNumber
                    }
                  >
                    {userServices.length}
                  </Text>

                  <Text
                    style={
                      styles.statLabel
                    }
                  >
                    {userServices.length ===
                    1
                      ? "Publicação"
                      : "Publicações"}
                  </Text>
                </View>

                <View
                  style={
                    styles.statDivider
                  }
                />

                <View
                  style={styles.statItem}
                >
                  <View
                    style={
                      styles.statIconYellow
                    }
                  >
                    <Ionicons
                      name="star"
                      size={23}
                      color="#F5B301"
                    />
                  </View>

                  <Text
                    style={
                      styles.statNumber
                    }
                  >
                    0
                  </Text>

                  <Text
                    style={
                      styles.statLabel
                    }
                  >
                    Avaliações
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={
                styles.servicesSection
              }
            >
              <View
                style={
                  styles.sectionTitleRow
                }
              >
                <View
                  style={styles.sectionIcon}
                >
                  <Ionicons
                    name="briefcase-outline"
                    size={21}
                    color="#1677FF"
                  />
                </View>

                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Serviços publicados
                </Text>
              </View>

              <View
                style={
                  styles.servicesCount
                }
              >
                <Text
                  style={
                    styles.servicesCountText
                  }
                >
                  {userServices.length ===
                  1
                    ? "1 serviço"
                    : `${userServices.length} serviços`}
                </Text>
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          <View
            style={styles.emptyContainer}
          >
            <View
              style={styles.emptyIcon}
            >
              <Ionicons
                name="briefcase-outline"
                size={42}
                color="#9ABEEA"
              />
            </View>

            <Text
              style={styles.emptyText}
            >
              Nenhum serviço publicado.
            </Text>
          </View>
        }
      />

      {/* MENU DO PERFIL */}
      {menuVisible && (
        <Pressable
          style={styles.menuOverlay}
          onPress={() =>
            setMenuVisible(false)
          }
        >
          <Pressable
            style={styles.profileMenu}
            onPress={(event) =>
              event.stopPropagation()
            }
          >
            <Text
              style={styles.menuTitle}
            >
              Opções
            </Text>

            <Pressable
              style={styles.menuItem}
              onPress={openReportModal}
            >
              <View
                style={
                  styles.menuIconReport
                }
              >
                <Ionicons
                  name="flag-outline"
                  size={21}
                  color="#E53935"
                />
              </View>

              <View
                style={
                  styles.menuTextContainer
                }
              >
                <Text
                  style={
                    styles.menuItemTitle
                  }
                >
                  Denunciar usuário
                </Text>

                <Text
                  style={
                    styles.menuItemDescription
                  }
                >
                  Informar um problema sobre este usuário
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                handleBlockUser();
              }}
            >
              <View
                style={
                  styles.menuIconBlock
                }
              >
                <Ionicons
                  name="ban-outline"
                  size={21}
                  color="#555555"
                />
              </View>

              <View
                style={
                  styles.menuTextContainer
                }
              >
                <Text
                  style={
                    styles.menuItemTitle
                  }
                >
                  Bloquear usuário
                </Text>

                <Text
                  style={
                    styles.menuItemDescription
                  }
                >
                  Impedir interações com este usuário
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={styles.menuCancel}
              onPress={() =>
                setMenuVisible(false)
              }
            >
              <Text
                style={styles.menuCancelText}
              >
                Cancelar
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      )}

      {/* MODAL DE DENÚNCIA */}
      <Modal
        visible={reportModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!sendingReport) {
            setReportModalVisible(false);
          }
        }}
      >
        <View
          style={styles.modalOverlay}
        >
          <View
            style={styles.reportModal}
          >
            <View
              style={styles.modalHandle}
            />

            <Text
              style={styles.reportTitle}
            >
              Denunciar usuário
            </Text>

            <Text
              style={styles.reportDescription}
            >
              Selecione o motivo da denúncia:
            </Text>

            <Pressable
              style={styles.reasonButton}
              onPress={() =>
                handleReportUser(
                  "Conteúdo inadequado"
                )
              }
              disabled={sendingReport}
            >
              <Ionicons
                name="warning-outline"
                size={21}
                color="#E53935"
              />

              <Text
                style={styles.reasonText}
              >
                Conteúdo inadequado
              </Text>
            </Pressable>

            <Pressable
              style={styles.reasonButton}
              onPress={() =>
                handleReportUser(
                  "Golpe ou fraude"
                )
              }
              disabled={sendingReport}
            >
              <Ionicons
                name="alert-circle-outline"
                size={21}
                color="#E53935"
              />

              <Text
                style={styles.reasonText}
              >
                Golpe ou fraude
              </Text>
            </Pressable>

            <Pressable
              style={styles.reasonButton}
              onPress={() =>
                handleReportUser(
                  "Comportamento abusivo"
                )
              }
              disabled={sendingReport}
            >
              <Ionicons
                name="sad-outline"
                size={21}
                color="#E53935"
              />

              <Text
                style={styles.reasonText}
              >
                Comportamento abusivo
              </Text>
            </Pressable>

            <Pressable
              style={styles.reasonButton}
              onPress={() =>
                handleReportUser(
                  "Outro motivo"
                )
              }
              disabled={sendingReport}
            >
              <Ionicons
                name="ellipsis-horizontal-circle-outline"
                size={21}
                color="#E53935"
              />

              <Text
                style={styles.reasonText}
              >
                Outro motivo
              </Text>
            </Pressable>

            <TextInput
              style={
                styles.reportInput
              }
              placeholder="Detalhes adicionais (opcional)"
              placeholderTextColor="#999"
              multiline
              value={reportDescription}
              onChangeText={
                setReportDescription
              }
              maxLength={500}
              editable={!sendingReport}
            />

            <Pressable
              style={
                styles.cancelReportButton
              }
              onPress={() =>
                setReportModalVisible(false)
              }
              disabled={sendingReport}
            >
              <Text
                style={
                  styles.cancelReportText
                }
              >
                Cancelar
              </Text>
            </Pressable>
          </View>
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
    backgroundColor:
      "rgba(255,255,255,0.15)",
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

  menuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor:
      "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },

  profileMenu: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 25,
  },

  menuTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#202020",
    marginBottom: 8,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
  },

  menuIconReport: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF0F0",
    alignItems: "center",
    justifyContent: "center",
  },

  menuIconBlock: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F0F2F5",
    alignItems: "center",
    justifyContent: "center",
  },

  menuTextContainer: {
    flex: 1,
    marginLeft: 13,
  },

  menuItemTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#202020",
  },

  menuItemDescription: {
    fontSize: 12,
    color: "#777777",
    marginTop: 3,
  },

  menuCancel: {
    marginTop: 8,
    backgroundColor: "#F0F2F5",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },

  menuCancelText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333333",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor:
      "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },

  reportModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 25,
  },

  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D5D5D5",
    alignSelf: "center",
    marginBottom: 18,
  },

  reportTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#202020",
  },

  reportDescription: {
    fontSize: 14,
    color: "#777777",
    marginTop: 5,
    marginBottom: 12,
  },

  reasonButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },

  reasonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333333",
    marginLeft: 12,
  },

  reportInput: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 15,
    fontSize: 14,
    color: "#222222",
    textAlignVertical: "top",
    backgroundColor: "#F8F9FA",
  },

  cancelReportButton: {
    marginTop: 12,
    backgroundColor: "#F0F2F5",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },

  cancelReportText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333333",
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