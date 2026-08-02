import * as Location from "expo-location";

export interface CurrentLocation {
  latitude: number;
  longitude: number;
  address: string;
}

export async function getCurrentLocation(): Promise<CurrentLocation> {

  const { status } =
    await Location.requestForegroundPermissionsAsync();

  if (status !== "granted") {
    throw new Error(
      "Permissão de localização negada."
    );
  }

  const location =
    await Location.getCurrentPositionAsync({
      accuracy:
        Location.Accuracy.High,
    });

  const addresses =
    await Location.reverseGeocodeAsync({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });

  const address = addresses[0];

  return {
    latitude: location.coords.latitude,

    longitude: location.coords.longitude,

    address: [
      address.street,
      address.streetNumber,
      address.district,
      address.city,
      address.region,
    ]
      .filter(Boolean)
      .join(", "),
  };
}