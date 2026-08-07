import { useUser } from "@/src/contexts/UserContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack } from "expo-router";
import { useEffect } from "react";
import {
  Dimensions,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const workersGroupSource = require("@/assets/images/onboarding/workers-group.png");
const workersGroupAsset = Image.resolveAssetSource(workersGroupSource);

const WORKERS_GROUP_WIDTH = Math.min(
  SCREEN_WIDTH - 30,
  420
);
const WORKERS_GROUP_HEIGHT =
  WORKERS_GROUP_WIDTH *
  (workersGroupAsset.height / workersGroupAsset.width);

function DotsGrid() {
  const rows = [0, 1, 2, 3, 4];
  const cols = [0, 1, 2, 3, 4];

  return (
    <View>
      {rows.map((row) => (
        <View key={row} style={{ flexDirection: "row" }}>
          {cols.map((col) => (
            <View key={col} style={styles.dot} />
          ))}
        </View>
      ))}
    </View>
  );
}

export default function Index() {
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      router.replace("/(tabs)");
    }
  }, [user]);

  const scale = useSharedValue(1);

const animatedButtonStyle = useAnimatedStyle(() => {
  return {
    transform: [{ scale: scale.value }],
  };
});

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Fundo */}
      <View style={styles.topCircle} />
      <View style={styles.bottomCircle} />

      <View style={styles.dotsTopRight}>
        <DotsGrid />
      </View>

      <View style={styles.dotsBottomLeft}>
        <DotsGrid />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Logo (já contém o nome e o subtítulo) */}
          <Animated.Image
            entering={FadeInDown.duration(700)}
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
          />

          {/* Imagem única com os 3 profissionais, badges e avaliação */}
          {/* Imagem única com os 3 profissionais, badges e avaliação */}
         <Animated.Image
            entering={FadeInUp.duration(900)}
            source={workersGroupSource}
            style={{
              width: WORKERS_GROUP_WIDTH,
              height: WORKERS_GROUP_HEIGHT,
              resizeMode: "contain",
              marginTop: -20,
              alignSelf: "center",
            }}
          />

          {/* Benefícios */}
          <Animated.View
              entering={FadeInUp.delay(200).duration(700)}
              style={styles.benefits}
            >
            <View style={styles.benefitItem}>
              <View style={styles.benefitIconWrap}>
                <Ionicons name="shield-checkmark" size={20} color="#1D4ED8" />
              </View>

              <Text style={styles.benefitText}>
                Profissionais{"\n"}verificados
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.benefitItem}>
              <View style={styles.benefitIconWrap}>
                <Ionicons
                  name="chatbubble-ellipses"
                  size={20}
                  color="#1D4ED8"
                />
              </View>

              <Text style={styles.benefitText}>
                Contato fácil{"\n"}e rápido
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.benefitItem}>
              <View style={styles.benefitIconWrap}>
                <Ionicons name="thumbs-up" size={20} color="#1D4ED8" />
              </View>

              <Text style={styles.benefitText}>Avaliações{"\n"}reais</Text>
            </View>
         </Animated.View>
          

          {/* Botão */}
        <Animated.View
          entering={FadeInUp.delay(350).duration(700)}
          style={[styles.footerBlock, animatedButtonStyle]}
        >
            <Pressable
  onPressIn={() => {
    scale.value = withSpring(0.96);
  }}
  onPressOut={() => {
    scale.value = withSpring(1);
  }}
  onPress={() => router.push("/(auth)/login")}
>

  <LinearGradient
    colors={["#2563EB", "#1D4ED8", "#1E40AF"]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={styles.ctaButton}
  >

    <Text style={styles.ctaButtonText}>
      Começar agora
    </Text>

    <View style={styles.ctaButtonIcon}>
      <Ionicons
        name="arrow-forward"
        size={18}
        color="#1D4ED8"
      />
    </View>
    </LinearGradient>
    
</Pressable>


            <View style={styles.footerNote}>
              <Ionicons name="shield-checkmark" size={13} color="#1D4ED8" />

              <Text style={styles.footerNoteText}>
                Seguro, rápido e{" "}
                <Text style={styles.footerNoteHighlight}>
                  sem complicação.
                </Text>
              </Text>
            </View>
            </Animated.View>
  
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  safeArea: {
    flex: 1,
  },

  container: {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: 20,
  paddingTop: 8,
  paddingBottom: 16,
},

  topCircle: {
    position: "absolute",
    top: -170,
    left: -170,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#1D4ED8",
  },

  bottomCircle: {
    position: "absolute",
    bottom: -170,
    right: -170,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#1D4ED8",
  },

  dotsTopRight: {
    position: "absolute",
    top: 70,
    right: 20,
    opacity: 0.5,
  },

  dotsBottomLeft: {
    position: "absolute",
    bottom: 110,
    left: 20,
    opacity: 0.5,
  },

  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#93C5FD",
    margin: 4,
  },

 logo: {
  width: 320,
  height: 190,
  resizeMode: "contain",

  position: "relative",
  top: -30,
},

 benefits: {
  width: "100%",
  height: 100,
  marginTop: 18,
  borderRadius: 24,
  backgroundColor: "#FFF",

  flexDirection: "row",
  justifyContent: "space-around",
  alignItems: "center",

  shadowColor: "#000",
  shadowOpacity: 0.12,
  shadowRadius: 20,
  shadowOffset: {
    width: 0,
    height: 8,
  },

  elevation: 12,
},

  benefitItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  benefitIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EFF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },

  benefitText: {
    fontSize: 12,
    textAlign: "center",
    color: "#1F2937",
    fontWeight: "600",
  },

  divider: {
    width: 1,
    height: 50,
    backgroundColor: "#E5E7EB",
  },

 footerBlock: {
  width: "90%",
  alignItems: "stretch",
  marginTop: 18,
},

 ctaButton: {
  width: "100%",
  height: 60,
  borderRadius: 30,

  justifyContent: "center",
  alignItems: "center",

  shadowColor: "#2563EB",
  shadowOpacity: 0.45,
  shadowRadius: 18,
  shadowOffset: {
    width: 0,
    height: 10,
  },

  elevation: 14,
},

  ctaButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },

  ctaButtonIcon: {
    position: "absolute",
    right: 6,
    top: 6,
     width: 46,
  height: 46,
  borderRadius: 23,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },

  footerNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
  },

  footerNoteText: {
    fontSize: 12,
    color: "#374151",
  },

  footerNoteHighlight: {
    fontWeight: "700",
    color: "#1D4ED8",
  },
});
