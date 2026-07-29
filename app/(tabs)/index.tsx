import { CategoryCard } from "@/src/components/CategoryCard";
import { SearchInput } from "@/src/components/SearchInput";
import { ServiceCard } from "@/src/components/ServiceCard";
import { useServices } from "@/src/contexts/ServiceContext";
import { useUser } from "@/src/contexts/UserContext";
import { categories } from "@/src/data/categories";
import { colors } from "@/src/theme/colors";

import { useMemo, useState } from "react";

import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function Home() {
  const [search, setSearch] = useState("");

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState<string | null>(null);

  const { user } = useUser();
  const { services } = useServices();

  const filteredServices = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return services.filter((service) => {
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

      return matchesSearch && matchesCategory;
    });
  }, [
    search,
    selectedCategory,
    services,
  ]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>
        👋 Olá,{" "}
        {user?.name || "seja bem-vindo"}
      </Text>

      <Text style={styles.subtitle}>
        Encontre o serviço ideal para o que você
        precisa.
      </Text>

      <SearchInput
        value={search}
        onChangeText={setSearch}
      />

      <Text style={styles.sectionTitle}>
        Categorias
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={
          styles.categoriesContainer
        }
      >
        {categories.map((category) => {
          const isSelected =
            selectedCategory === category.name;

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
        })}
      </ScrollView>

      <View style={styles.servicesHeader}>
        <Text style={styles.sectionTitle}>
          Serviços disponíveis
        </Text>

        <View style={styles.countContainer}>
          <Text style={styles.servicesCount}>
            {filteredServices.length}
          </Text>
        </View>
      </View>

      {filteredServices.length > 0 ? (
        <View style={styles.servicesGrid}>
          {filteredServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>
            🔎
          </Text>

          <Text style={styles.emptyTitle}>
            Nenhum serviço encontrado
          </Text>

          <Text style={styles.emptyDescription}>
            Publique um serviço ou tente pesquisar
            por outro termo.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 120,
  },

  title: {
    fontSize: 29,
    fontWeight: "800",
    color: colors.black,
  },

  subtitle: {
    fontSize: 16,
    color: colors.gray600,
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 22,
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: colors.black,
    marginTop: 28,
    marginBottom: 15,
  },

  categoriesContainer: {
    paddingRight: 20,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  countContainer: {
    minWidth: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: "#E8F2FF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },

  servicesCount: {
    color: "#1677FF",
    fontWeight: "700",
  },

  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
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
});