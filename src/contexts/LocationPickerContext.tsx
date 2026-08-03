import {
  createContext,
  ReactNode,
  useContext,
  useState,
} from "react";

type SelectedLocation = {
  latitude: number;
  longitude: number;
  address: string;
} | null;

type LocationPickerContextData = {
  selectedLocation: SelectedLocation;
  setSelectedLocation: (
    location: SelectedLocation
  ) => void;
};

const LocationPickerContext =
  createContext<LocationPickerContextData>(
    {} as LocationPickerContextData
  );

export function LocationPickerProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [
    selectedLocation,
    setSelectedLocation,
  ] = useState<SelectedLocation>(null);

  return (
    <LocationPickerContext.Provider
      value={{
        selectedLocation,
        setSelectedLocation,
      }}
    >
      {children}
    </LocationPickerContext.Provider>
  );
}

export function useLocationPicker() {
  return useContext(
    LocationPickerContext
  );
}