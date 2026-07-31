import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  Text,
  View
} from "react-native";

type Props = {
  isMine: boolean;
  isPlaying: boolean;
  currentTime: string;
  duration: string;
  progress: number;
  messageTime: string;
  status?: "sent" | "delivered" | "read";
  playbackRate: number;
  onPlayPause: () => void;
  onChangeSpeed: () => void;
  onSeek: (progress: number) => void;
};

export function AudioPlayer({
  isMine,
  isPlaying,
  currentTime,
  duration,
  progress,
  messageTime,
  status,
  playbackRate,
  onPlayPause,
  onChangeSpeed,
  onSeek,
}: Props) {
  const [waveWidth, setWaveWidth] = useState(1);
  const [dragProgress, setDragProgress] = useState(progress);

  const dragging = useRef(false);

  useEffect(() => {
    if (!dragging.current) {
      setDragProgress(progress);
    }
  }, [progress]);

  const bars = [
    7,12,18,10,14,20,9,16,13,8,
    19,15,11,17,9,21,12,16,10,18,
    13,9,20,14,11,17,8,16,12,19,
    10,15,21,13,9,18,14,11,17,12,
  ];

  function clamp(value: number) {
    return Math.max(0, Math.min(1, value));
  }

  function update(x: number) {
    const value = clamp(x / waveWidth);

    setDragProgress(value);

    return value;
  }

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,

    onMoveShouldSetPanResponder: () => true,

    onPanResponderGrant: (event) => {
      dragging.current = true;

      update(event.nativeEvent.locationX);
    },

    onPanResponderMove: (event) => {
      update(event.nativeEvent.locationX);
    },

    onPanResponderRelease: (event) => {
      const value = update(
        event.nativeEvent.locationX
      );

      dragging.current = false;

      onSeek(value);
    },
  });

    return (
    <View
      style={{
        width: 235,
        paddingVertical: 2,
        alignSelf: "flex-start",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Pressable
          onPress={onPlayPause}
          style={{
            width: 42,
            height: 42,
            borderRadius: 23,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: isMine
              ? "rgba(255,255,255,.18)"
              : "#EAF2FF",
          }}
        >
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={20}
            color={isMine ? "#FFF" : "#1677FF"}
          />
        </Pressable>

        <View
          onLayout={(event: LayoutChangeEvent) => {
            setWaveWidth(event.nativeEvent.layout.width);
          }}
          {...panResponder.panHandlers}
          style={{
            flex: 1,
            marginLeft: 12,
            height: 44,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-evenly",
          }}
        >
          {bars.map((height, index) => {
            const active =
              index <
              dragProgress * bars.length;

            return (
              <View
                key={index}
                style={{
                  width: 3,
                  marginHorizontal: 0.8,
                  height,
                  borderRadius: 3,
                  backgroundColor: active
                    ? isMine
                      ? "#FFF"
                      : "#1677FF"
                    : isMine
                    ? "rgba(255,255,255,.28)"
                    : "#D8DCE5",
                }}
              />
            );
          })}
        </View>
      </View>

      <View
        style={{
          marginTop: 8,
          paddingLeft: 48,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontSize: 11,
            color: isMine ? "#F4F4F4" : "#666",
          }}
        >
          {currentTime} / {duration}
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Pressable
            onPress={onChangeSpeed}
            style={{
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 10,
              backgroundColor: isMine
                ? "rgba(255,255,255,.15)"
                : "#EEF4FF",
              marginRight: 8,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: isMine ? "#FFF" : "#1677FF",
              }}
            >
              {playbackRate}x
            </Text>
          </Pressable>

          <Text
            style={{
              fontSize: 11,
              color: isMine ? "#F4F4F4" : "#666",
            }}
          >
            {messageTime}
          </Text>

          {status && (
            <Ionicons
              style={{
                marginLeft: 4,
              }}
              name={
                status === "sent"
                  ? "checkmark"
                  : "checkmark-done"
              }
              size={15}
              color={
                status === "read"
                  ? "#4FC3F7"
                  : isMine
                  ? "#FFF"
                  : "#999"
              }
            />
          )}
        </View>
      </View>
    </View>
  );
}