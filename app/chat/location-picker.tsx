import { useLocationPicker } from "@/src/contexts/LocationPickerContext";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router } from "expo-router";
import {
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
const [search, setSearch] = useState("");

const [searchResults, setSearchResults] =
  useState<
    {
      name: string;
      latitude: number;
      longitude: number;
    }[]
  >([]);
const { setSelectedLocation } =
  useLocationPicker();

useEffect(() => {
  async function loadLocation() {
    const permission =
      await Location.requestForegroundPermissionsAsync();

    if (!permission.granted) {
      return;
    }

    const current =
      await Location.getCurrentPositionAsync({});

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

useEffect(() => {
  searchPlaces(search);
}, [search]);

async function loadAddress(
  latitude: number,
  longitude: number
) {
  try {
    const result =
      await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

    if (result.length > 0) {
      const place = result[0];

      setAddress(
        [
          place.street,
          place.streetNumber,
          place.district,
          place.city,
        ]
          .filter(Boolean)
          .join(", ")
      );
    }
  } catch (error) {
    console.log(error);
  }
}

async function searchPlaces(query: string) {
  if (query.trim().length < 3) {
    setSearchResults([]);
    return;
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&limit=8`
    );

    const data = await response.json();

    setSearchResults(
      data.map((item: any) => ({
        name: item.display_name,
        latitude: Number(item.lat),
        longitude: Number(item.lon),
      }))
    );
  } catch (error) {
    console.log(error);
  }
}

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={24}
            color="#202020"
          />
        </Pressable>

        <Text style={styles.title}>
          Escolher localização
        </Text>

        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#777"
        />

        <TextInput
  placeholder="Pesquisar endereço..."
  style={styles.input}
  value={search}
  onChangeText={setSearch}
/>
      </View>

     <MapView
  style={styles.map}
  region={region}
  showsUserLocation
  showsMyLocationButton
  onRegionChangeComplete={async (newRegion) => {
  setRegion(newRegion);

  await loadAddress(
    newRegion.latitude,
    newRegion.longitude
  );
}}
>
  <Marker coordinate={region} />
</MapView>


{searchResults.length > 0 && (
  <View
    style={{
      backgroundColor: "#FFF",
      marginHorizontal: 16,
      borderRadius: 14,
      marginBottom: 10,
      maxHeight: 220,
      elevation: 4,
    }}
  >
    {searchResults.map((place, index) => (
      <Pressable
        key={index}
        onPress={() => {
          setRegion({
            latitude: place.latitude,
            longitude: place.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });

          setAddress(place.name);
          setSearch(place.name);
          setSearchResults([]);
        }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 14,
          borderBottomWidth:
            index === searchResults.length - 1 ? 0 : 1,
          borderBottomColor: "#EEE",
        }}
      >
        <Ionicons
          name="location"
          size={22}
          color="#1677FF"
        />

        <Text
          numberOfLines={2}
          style={{
            marginLeft: 12,
            flex: 1,
            color: "#202020",
          }}
        >
          {place.name}
        </Text>
      </Pressable>
    ))}
  </View>
)}

<View
  style={{
    backgroundColor: "#FFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 18,
    elevation: 8,
  }}
>

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
      <Ionicons
        name="location"
        size={24}
        color="#FFF"
      />
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
        style={{
          color: "#666",
          marginTop: 4,
        }}
      >
        {address || "Carregando endereço..."}
      </Text>
    </View>

    <Ionicons
      name="chevron-forward"
      size={22}
      color="#999"
    />

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

  searchContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#F4F4F4",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
  },

  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
  },

  map: {
    flex: 1,
  },

});