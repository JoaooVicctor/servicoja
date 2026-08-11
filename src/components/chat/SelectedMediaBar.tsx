import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, ScrollView, View } from "react-native";

type Props = {
  images: string[];
  videos: string[];

  onRemoveImage(index: number): void;
  onRemoveVideo(index: number): void;
};

export function SelectedMediaBar({
  images,
  videos,
  onRemoveImage,
  onRemoveVideo,
}: Props) {
  if (
    images.length === 0 &&
    videos.length === 0
  ) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: "#FFF",
        borderTopWidth: 1,
        borderTopColor: "#E5E5E5",
      }}
    >
      {images.map((image, index) => (
        <View
          key={`image-${index}`}
          style={{
            marginRight: 10,
          }}
        >
          <Image
            source={{ uri: image }}
            style={{
              width: 120,
              height: 120,
              borderRadius: 12,
            }}
          />

          <Pressable
            onPress={() =>
              onRemoveImage(index)
            }
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: "#000",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons
              name="close"
              size={16}
              color="#FFF"
            />
          </Pressable>
        </View>
      ))}

      {videos.map((video, index) => (
        <View
          key={`video-${index}`}
          style={{
            width: 120,
            height: 120,
            borderRadius: 12,
            backgroundColor: "#111",
            justifyContent: "center",
            alignItems: "center",
            marginRight: 10,
          }}
        >
          <Ionicons
            name="videocam"
            size={38}
            color="#FFF"
          />

          <Pressable
            onPress={() =>
              onRemoveVideo(index)
            }
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: "#000",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons
              name="close"
              size={16}
              color="#FFF"
            />
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}