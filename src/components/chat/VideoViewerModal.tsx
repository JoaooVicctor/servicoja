import { Ionicons } from "@expo/vector-icons";
import { VideoView, useVideoPlayer } from "expo-video";
import { Modal, Pressable, View } from "react-native";

type Props = {
  visible: boolean;
  uri: string;
  onClose(): void;
};

export function VideoViewerModal({
  visible,
  uri,
  onClose,
}: Props) {
  const player = useVideoPlayer(uri, (player) => {
    player.loop = false;
  });

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "#000",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <VideoView
          player={player}
          style={{
            width: "100%",
            height: "100%",
          }}
          nativeControls
          contentFit="contain"
        />

        <Pressable
          onPress={onClose}
          style={{
            position: "absolute",
            top: 55,
            right: 20,
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: "rgba(0,0,0,.6)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons
            name="close"
            size={28}
            color="#FFF"
          />
        </Pressable>
      </View>
    </Modal>
  );
}