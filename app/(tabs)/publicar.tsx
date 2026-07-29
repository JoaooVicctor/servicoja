import { useServices } from "@/src/contexts/ServiceContext";
import { useUser } from "@/src/contexts/UserContext";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";

import {
  useCallback,
  useState,
} from "react";

import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const categories = [
  "Beleza",
  "Construção",
  "Elétrica",
  "Encanador",
  "Limpeza",
  "Informática",
  "Fretes",
  "Pintura",
  "Fotografia",
  "Aulas",
  "Pets",
  "Outros",
];

type AttendanceType =
  | "local"
  | "domicilio"
  | "online";

export default function Publicar() {
  const { user } = useUser();

  const {
    services,
    createService,
    updateService,
    getServiceById,
  } = useServices();

  const { editId } = useLocalSearchParams<{
    editId?: string | string[];
  }>();

  const editingServiceId = Array.isArray(editId)
    ? editId[0]
    : editId;

  const isEditing = Boolean(editingServiceId);

  const [images, setImages] = useState<string[]>([]);

  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] =
    useState("");

  const [whatsapp, setWhatsapp] = useState("");

  const [attendance, setAttendance] = useState<
    AttendanceType[]
  >([]);

  const [showCategories, setShowCategories] =
    useState(false);

  const [isPublishing, setIsPublishing] =
    useState(false);

  useFocusEffect(
  useCallback(() => {
    if (!editingServiceId) {
      clearForm();
      return;
    }

    const service =
      getServiceById(editingServiceId);

    if (!service) {
      return;
    }

    if (
      user &&
      service.userId !== user.id
    ) {
      if (Platform.OS === "web") {
        window.alert(
          "Você só pode editar os seus próprios serviços."
        );
      } else {
        Alert.alert(
          "Acesso não permitido",
          "Você só pode editar os seus próprios serviços."
        );
      }

      router.replace(
        "/(tabs)/meus-servicos"
      );

      return;
    }

    setImages([...service.images]);
    setCategory(service.category);
    setPrice(service.price);
    setTitle(service.title);
    setDescription(service.description);
    setCity(service.city);
    setNeighborhood(service.neighborhood);
    setWhatsapp(service.whatsapp);
    setAttendance([...service.attendance]);
    setShowCategories(false);
  }, [
    editingServiceId,
    services,
    user?.id,
  ])
);

  async function handleSelectImages() {
    if (images.length >= 5) {
      Alert.alert(
        "Limite de fotos",
        "Você pode adicionar no máximo 5 fotos."
      );

      return;
    }

    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permissão necessária",
        "Precisamos da sua permissão para acessar as fotos."
      );

      return;
    }

    const availableSlots = 5 - images.length;

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: availableSlots,
        quality: 0.8,
      });

    if (result.canceled) {
      return;
    }

    const selectedImages = result.assets
      .slice(0, availableSlots)
      .map((asset) => asset.uri);

    setImages((currentImages) => [
      ...currentImages,
      ...selectedImages,
    ]);
  }

  function handleRemoveImage(imageUri: string) {
    setImages((currentImages) =>
      currentImages.filter(
        (image) => image !== imageUri
      )
    );
  }

  function handleSelectCategory(
    selectedCategory: string
  ) {
    setCategory(selectedCategory);
    setShowCategories(false);
  }

  function handleAttendance(
    attendanceType: AttendanceType
  ) {
    const isSelected =
      attendance.includes(attendanceType);

    if (isSelected) {
      setAttendance((currentAttendance) =>
        currentAttendance.filter(
          (item) => item !== attendanceType
        )
      );

      return;
    }

    setAttendance((currentAttendance) => [
      ...currentAttendance,
      attendanceType,
    ]);
  }

  function validateForm() {
    if (images.length < 1) {
      Alert.alert(
        "Adicione uma foto",
        "É obrigatório adicionar pelo menos uma foto."
      );

      return false;
    }

    if (!category) {
      Alert.alert(
        "Selecione uma categoria",
        "Escolha a categoria do serviço."
      );

      return false;
    }

    if (!price.trim()) {
      Alert.alert(
        "Informe o valor",
        "Digite o valor do serviço ou escreva A combinar."
      );

      return false;
    }

    if (!title.trim()) {
      Alert.alert(
        "Informe o título",
        "Digite um título para o seu serviço."
      );

      return false;
    }

    if (!description.trim()) {
      Alert.alert(
        "Informe a descrição",
        "Descreva o serviço que você oferece."
      );

      return false;
    }

    if (!city.trim()) {
      Alert.alert(
        "Informe a cidade",
        "Digite a cidade onde o serviço é oferecido."
      );

      return false;
    }

    if (!neighborhood.trim()) {
      Alert.alert(
        "Informe o bairro",
        "Digite o bairro onde o serviço é oferecido."
      );

      return false;
    }

    if (!whatsapp.trim()) {
      Alert.alert(
        "Informe o WhatsApp",
        "Digite um número para contato."
      );

      return false;
    }

    if (attendance.length < 1) {
      Alert.alert(
        "Tipo de atendimento",
        "Selecione pelo menos um tipo de atendimento."
      );

      return false;
    }

    return true;
  }

  async function handlePublish() {
    if (!validateForm()) {
      return;
    }

    if (!user) {
      Alert.alert(
        "Usuário não encontrado",
        "Entre novamente na sua conta."
      );

      return;
    }

    try {
      setIsPublishing(true);

      const serviceData = {
        images,
        category,
        price: price.trim(),
        title: title.trim(),
        description: description.trim(),
        city: city.trim(),
        neighborhood: neighborhood.trim(),
        whatsapp: whatsapp.trim(),
        attendance,
      };

      if (
        isEditing &&
        editingServiceId
      ) {
        
        await updateService(
  editingServiceId,
  serviceData
);

clearForm();

if (Platform.OS === "web") {
  window.alert(
    "Serviço atualizado com sucesso!"
  );

  router.replace(
    "/(tabs)/meus-servicos"
  );

  return;
}

Alert.alert(
  "Serviço atualizado!",
  "As alterações foram salvas com sucesso.",
  [
    {
      text: "Ver meus serviços",
      onPress: () => {
        router.replace(
          "/(tabs)/meus-servicos"
        );
      },
    },
  ]
);

return;

      }

      await createService({
        userId: user.id,
        userName: user.name,
        ...serviceData,
      });

      clearForm();

      Alert.alert(
        "Serviço publicado!",
        "Seu anúncio foi publicado com sucesso.",
        [
          {
            text: "Ver na Home",
            onPress: () =>
              router.replace("/(tabs)"),
          },
        ]
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível publicar o serviço.";

      Alert.alert(
        "Erro ao publicar",
        message
      );
    } finally {
      setIsPublishing(false);
    }
  }

  function clearForm() {
    setImages([]);
    setCategory("");
    setPrice("");
    setTitle("");
    setDescription("");
    setCity("");
    setNeighborhood("");
    setWhatsapp("");
    setAttendance([]);
    setShowCategories(false);
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            {isEditing
              ? "Editar serviço"
              : "Publicar serviço"}
          </Text>

          <Text style={styles.subtitle}>
            {isEditing
              ? "Atualize as informações do seu anúncio."
              : "Crie um anúncio para oferecer seu trabalho."}
          </Text>
        </View>

        {/* FOTOS */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Fotos do serviço *
          </Text>

          <Text style={styles.sectionDescription}>
            Adicione de 1 a 5 fotos. A primeira
            será a capa do anúncio.
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={
              styles.imagesContainer
            }
          >
            {images.map((image, index) => (
              <View
                key={`${image}-${index}`}
                style={styles.imageWrapper}
              >
                <Image
                  source={{ uri: image }}
                  style={styles.image}
                />

                {index === 0 && (
                  <View style={styles.coverBadge}>
                    <Text style={styles.coverText}>
                      Capa
                    </Text>
                  </View>
                )}

                <Pressable
                  style={styles.removeImageButton}
                  onPress={() =>
                    handleRemoveImage(image)
                  }
                >
                  <Ionicons
                    name="close"
                    size={18}
                    color="#FFFFFF"
                  />
                </Pressable>
              </View>
            ))}

            {images.length < 5 && (
              <Pressable
                style={styles.addImageButton}
                onPress={handleSelectImages}
              >
                <Ionicons
                  name="camera-outline"
                  size={32}
                  color="#1677FF"
                />

                <Text style={styles.addImageText}>
                  Adicionar
                </Text>
              </Pressable>
            )}
          </ScrollView>

          <Text style={styles.photoCounter}>
            {images.length}/5 fotos
          </Text>
        </View>

        {/* CATEGORIA */}

        <View style={styles.section}>
          <Text style={styles.label}>
            Categoria *
          </Text>

          <Pressable
            style={styles.selectInput}
            onPress={() =>
              setShowCategories(
                (currentValue) => !currentValue
              )
            }
          >
            <Text
              style={[
                styles.selectText,
                !category &&
                  styles.placeholderText,
              ]}
            >
              {category ||
                "Selecione uma categoria"}
            </Text>

            <Ionicons
              name={
                showCategories
                  ? "chevron-up"
                  : "chevron-down"
              }
              size={22}
              color="#555555"
            />
          </Pressable>

          {showCategories && (
            <View style={styles.categoriesList}>
              {categories.map(
                (categoryItem) => (
                  <Pressable
                    key={categoryItem}
                    style={[
                      styles.categoryOption,

                      category ===
                        categoryItem &&
                        styles.selectedCategoryOption,
                    ]}
                    onPress={() =>
                      handleSelectCategory(
                        categoryItem
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,

                        category ===
                          categoryItem &&
                          styles.selectedCategoryText,
                      ]}
                    >
                      {categoryItem}
                    </Text>

                    {category ===
                      categoryItem && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color="#1677FF"
                      />
                    )}
                  </Pressable>
                )
              )}
            </View>
          )}
        </View>

        {/* VALOR */}

        <View style={styles.section}>
          <Text style={styles.label}>
            Valor *
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Ex.: R$ 35,00 ou A combinar"
            placeholderTextColor="#929292"
            value={price}
            onChangeText={setPrice}
          />
        </View>

        {/* TÍTULO */}

        <View style={styles.section}>
          <Text style={styles.label}>
            Título do serviço *
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Ex.: Corte masculino degradê"
            placeholderTextColor="#929292"
            value={title}
            onChangeText={setTitle}
            maxLength={70}
          />

          <Text style={styles.characterCounter}>
            {title.length}/70
          </Text>
        </View>

        {/* DESCRIÇÃO */}

        <View style={styles.section}>
          <Text style={styles.label}>
            Descrição *
          </Text>

          <TextInput
            style={styles.descriptionInput}
            placeholder="Conte os detalhes do serviço que você oferece..."
            placeholderTextColor="#929292"
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
            maxLength={500}
          />

          <Text style={styles.characterCounter}>
            {description.length}/500
          </Text>
        </View>

        {/* LOCALIZAÇÃO */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Localização
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Cidade"
            placeholderTextColor="#929292"
            value={city}
            onChangeText={setCity}
          />

          <TextInput
            style={styles.input}
            placeholder="Bairro"
            placeholderTextColor="#929292"
            value={neighborhood}
            onChangeText={setNeighborhood}
          />
        </View>

        {/* WHATSAPP */}

        <View style={styles.section}>
          <Text style={styles.label}>
            WhatsApp *
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Ex.: (99) 99999-9999"
            placeholderTextColor="#929292"
            value={whatsapp}
            onChangeText={setWhatsapp}
            keyboardType="phone-pad"
          />
        </View>

        {/* ATENDIMENTO */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Tipo de atendimento *
          </Text>

          <Text style={styles.sectionDescription}>
            Você pode selecionar mais de uma
            opção.
          </Text>

          <AttendanceOption
            label="Atendimento no local"
            icon="storefront-outline"
            selected={attendance.includes(
              "local"
            )}
            onPress={() =>
              handleAttendance("local")
            }
          />

          <AttendanceOption
            label="Atendimento em domicílio"
            icon="home-outline"
            selected={attendance.includes(
              "domicilio"
            )}
            onPress={() =>
              handleAttendance("domicilio")
            }
          />

          <AttendanceOption
            label="Atendimento online"
            icon="videocam-outline"
            selected={attendance.includes(
              "online"
            )}
            onPress={() =>
              handleAttendance("online")
            }
          />
        </View>

        <Pressable
          style={[
            styles.publishButton,
            isPublishing &&
              styles.disabledButton,
          ]}
          onPress={handlePublish}
          disabled={isPublishing}
        >
          <Text style={styles.publishButtonText}>
            {isPublishing
              ? isEditing
                ? "Atualizando..."
                : "Publicando..."
              : isEditing
                ? "Atualizar serviço"
                : "Publicar serviço"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

interface AttendanceOptionProps {
  label: string;

  icon:
    | "storefront-outline"
    | "home-outline"
    | "videocam-outline";

  selected: boolean;
  onPress: () => void;
}

function AttendanceOption({
  label,
  icon,
  selected,
  onPress,
}: AttendanceOptionProps) {
  return (
    <Pressable
      style={[
        styles.attendanceOption,
        selected &&
          styles.selectedAttendanceOption,
      ]}
      onPress={onPress}
    >
      <View style={styles.attendanceContent}>
        <Ionicons
          name={icon}
          size={23}
          color={
            selected ? "#1677FF" : "#555555"
          }
        />

        <Text
          style={[
            styles.attendanceText,
            selected &&
              styles.selectedAttendanceText,
          ]}
        >
          {label}
        </Text>
      </View>

      <View
        style={[
          styles.checkbox,
          selected && styles.selectedCheckbox,
        ]}
      >
        {selected && (
          <Ionicons
            name="checkmark"
            size={16}
            color="#FFFFFF"
          />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: "#F5F6F8",
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 55,
    paddingBottom: 50,
  },

  header: {
    marginBottom: 24,
  },

  title: {
    fontSize: 29,
    fontWeight: "800",
    color: "#171717",
  },

  subtitle: {
    fontSize: 15,
    color: "#707070",
    marginTop: 6,
    lineHeight: 21,
  },

  section: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 5,
  },

  sectionDescription: {
    fontSize: 13,
    color: "#777777",
    lineHeight: 19,
    marginBottom: 13,
  },

  label: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 9,
  },

  imagesContainer: {
    gap: 12,
    paddingVertical: 4,
  },

  imageWrapper: {
    width: 125,
    height: 125,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#E5E5E5",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  addImageButton: {
    width: 125,
    height: 125,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#1677FF",
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  addImageText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1677FF",
  },

  removeImageButton: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    alignItems: "center",
    justifyContent: "center",
  },

  coverBadge: {
    position: "absolute",
    left: 7,
    bottom: 7,
    backgroundColor: "#1677FF",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },

  coverText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },

  photoCounter: {
    marginTop: 9,
    fontSize: 13,
    color: "#707070",
  },

  input: {
    minHeight: 54,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#222222",
    marginBottom: 12,
  },

  descriptionInput: {
    minHeight: 140,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
    color: "#222222",
  },

  characterCounter: {
    marginTop: 6,
    textAlign: "right",
    color: "#858585",
    fontSize: 12,
  },

  selectInput: {
    minHeight: 54,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  selectText: {
    fontSize: 16,
    color: "#222222",
  },

  placeholderText: {
    color: "#929292",
  },

  categoriesList: {
    marginTop: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    overflow: "hidden",
  },

  categoryOption: {
    minHeight: 50,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  selectedCategoryOption: {
    backgroundColor: "#EFF6FF",
  },

  categoryOptionText: {
    fontSize: 15,
    color: "#333333",
  },

  selectedCategoryText: {
    color: "#1677FF",
    fontWeight: "700",
  },

  attendanceOption: {
    minHeight: 59,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 15,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  selectedAttendanceOption: {
    borderColor: "#1677FF",
    backgroundColor: "#EFF6FF",
  },

  attendanceContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  attendanceText: {
    fontSize: 15,
    color: "#444444",
  },

  selectedAttendanceText: {
    color: "#1677FF",
    fontWeight: "700",
  },

  checkbox: {
    width: 23,
    height: 23,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#AAAAAA",
    alignItems: "center",
    justifyContent: "center",
  },

  selectedCheckbox: {
    backgroundColor: "#1677FF",
    borderColor: "#1677FF",
  },

  publishButton: {
    height: 57,
    borderRadius: 14,
    backgroundColor: "#1677FF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },

  disabledButton: {
    opacity: 0.65,
  },

  publishButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },
});