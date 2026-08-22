import { useUnreadConversationsCount } from "@/src/hooks/useUnreadConversationsCount";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  const unreadConversationsCount =
    useUnreadConversationsCount();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: "#1677FF",
        tabBarInactiveTintColor: "#777777",

        tabBarStyle: {
          height: 68,
          paddingTop: 7,
          paddingBottom: 8,
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E8E8E8",
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="home-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="favoritos"
        options={{
          title: "Favoritos",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="heart-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="conversas"
        options={{
          title: "Conversas",
          tabBarBadge:
            unreadConversationsCount > 0
              ? unreadConversationsCount > 99
                ? "99+"
                : unreadConversationsCount
              : undefined,
          tabBarBadgeStyle: {
            backgroundColor: "#20D45A",
            color: "#FFFFFF",
            fontSize: 11,
            fontWeight: "800",
          },
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="publicar"
        options={{
          title: "Publicar",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="add-circle-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="meus-servicos"
        options={{
          title: "Meus serviços",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="briefcase-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="person-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}