import { useLocationPicker } from "@/src/contexts/LocationPickerContext";
import { getCurrentLocation } from "@/src/services/location";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useEffect, useState } from "react";
import MapView, { Marker } from "react-native-maps";

export default function LocationPicker() {
  const [region, setRegion] = useState({
    latitude: -5.52639,
    longitude: -47.49167,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [address, setAddress] = useState("");
  const [addressEditedManually, setAddressEditedManually] = useState(false);

  const [loadingCurrentLocation, setLoadingCurrentLocation] = useState(false);

  const { setSelectedLocation } = useLocationPicker();

  useEffect(() => {
    async function loadLocation() {
      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        return;
      }

      const current = await Location.getCurrentPositionAsync({});

      setRegion({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      await loadAddress(
        current.coords.latitude,
        current.coords.longitude
      );
    }

    loadLocation();
  }, []);

  async function loadAddress(latitude: number, longitude: number) {
    // não sobrescreve o texto se o usuário já editou manualmente
    if (addressEditedManually) {
      return;
    }

    try {
      const result = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (result.length > 0) {
        const place = result[0];

        setAddress(
          [place.street, place.streetNumber, place.district, place.city]
            .filter(Boolean)
            .join(", ")
        );
      }
    } catch (error) {
      console.log(error);
    }
  }

  // botão "localização atual" (fixa, igual whatsapp) - envia direto
  async function handleSendCurrentLocation() {
    try {
      setLoadingCurrentLocation(true);

      const current = await getCurrentLocation();

      setSelectedLocation({
        latitude: current.latitude,
        longitude: current.longitude,
        address: current.address,
      });

      router.back();
    } catch (error) {
      Alert.alert(
        "Erro",
        error instanceof Error
          ? error.message
          : "Não foi possível obter sua localização atual."
      );
    } finally {
      setLoadingCurrentLocation(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#202020" />
        </Pressable>

        <Text style={styles.title}>Escolher localização</Text>

        <View style={{ width: 24 }} />
      </View>

      {/* Botão rápido: enviar localização atual, sem editar nada */}
      <Pressable
        style={styles.currentLocationButton}
        onPress={handleSendCurrentLocation}
        disabled={loadingCurrentLocation}
      >
        <View style={styles.currentLocationIcon}>
          {loadingCurrentLocation ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Ionicons name="navigate" size={20} color="#FFF" />
          )}
        </View>

        <Text style={styles.currentLocationText}>
          Enviar minha localização atual
        </Text>
      </Pressable>

      <MapView
        style={styles.map}
        region={region}
        showsUserLocation
        showsMyLocationButton
        onRegionChangeComplete={async (newRegion) => {
          setRegion(newRegion);

          await loadAddress(newRegion.latitude, newRegion.longitude);
        }}
      >
        <Marker coordinate={region} />
      </MapView>

      <View
        style={{
          backgroundColor: "#FFF",
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          padding: 18,
          elevation: 8,
        }}
      >
        {/* Campo de endereço editável */}
        <Text style={styles.addressLabel}>Endereço</Text>

        <TextInput
          style={styles.addressInput}
          value={address}
          placeholder="Digite ou edite o endereço..."
          multiline
          onChangeText={(value) => {
            setAddress(value);
            setAddressEditedManually(true);
          }}
        />

        <Pressable
          onPress={() => {
            setSelectedLocation({
              latitude: region.latitude,
              longitude: region.longitude,
              address,
            });

            router.back();
          }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 12,
            marginTop: 8,
          }}
        >
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              backgroundColor: "#1677FF",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="location" size={24} color="#FFF" />
          </View>

          <View
            style={{
              marginLeft: 14,
              flex: 1,
            }}
          >
            <Text
              style={{
                fontWeight: "700",
                fontSize: 16,
              }}
            >
              Enviar esta localização
            </Text>

            <Text
              numberOfLines={1}
              style={{
                color: "#666",
                marginTop: 4,
              }}
            >
              {address || "Carregando endereço..."}
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={22} color="#999" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },

  header: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
  },

  currentLocationButton: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#FFF",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },

  currentLocationIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#1677FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  currentLocationText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1677FF",
  },

  map: {
    flex: 1,
  },

  addressLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#999",
    marginBottom: 6,
  },

  addressInput: {
    fontSize: 15,
    color: "#202020",
    backgroundColor: "#F4F4F4",
    borderRadius: 12,
    padding: 12,
    minHeight: 44,
  },
});
