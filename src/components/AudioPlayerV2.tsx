import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";

type Props = {
  isMine: boolean;
  isPlaying: boolean;
  currentTime: string;
  duration: string;
  progress: number;
  playbackRate: number;
  messageTime: string;
  status?: "sent" | "delivered" | "read";

  onPlayPause(): void;
  onSeek(progress: number): void;
  onSeekStart?(): void;
  onSeekEnd?(): void;
  onChangeSpeed(): void;
};

const bars = [
  7,12,18,10,14,20,9,16,13,8,
  19,15,11,17,9,21,12,16,10,18,
  13,9,20,14,11,17,8,16,12,19,
  10,15,21,13,9,18,14,11,17,12,
];

function clamp(value: number) {
  "worklet";
  return Math.max(0, Math.min(1, value));
}

export function AudioPlayerV2({
  isMine,
  isPlaying,
  currentTime,
  duration,
  progress,
  playbackRate,
  messageTime,
  status,
  onPlayPause,
  onSeek,
  onSeekStart,
  onSeekEnd,
  onChangeSpeed,
}: Props) {

  const widthRef = useRef(0);
  const [dragProgress, setDragProgress] = useState<number | null>(null);

  // garante que o seek só é aplicado UMA vez por gesto,
  // mesmo que onEnd e onFinalize disparem os dois
  const hasCommittedRef = useRef(false);

  const onSeekRef = useRef(onSeek);
  onSeekRef.current = onSeek;
  const onSeekStartRef = useRef(onSeekStart);
  onSeekStartRef.current = onSeekStart;
  const onSeekEndRef = useRef(onSeekEnd);
  onSeekEndRef.current = onSeekEnd;

  function updateFromX(x: number) {
    const width = widthRef.current;
    if (width > 0) {
      setDragProgress(clamp(x / width));
    }
  }

  async function finishAt(x: number) {
    const width = widthRef.current;
    const finalProgress = width > 0 ? clamp(x / width) : 0;
    await onSeekRef.current(finalProgress);
    setDragProgress(null);
    onSeekEndRef.current?.();
  }

  const panGesture = Gesture.Pan()
    .shouldCancelWhenOutside(false)
    .runOnJS(true)
    .onStart((e) => {
      hasCommittedRef.current = false;
      onSeekStartRef.current?.();
      updateFromX(e.x);
    })
    .onUpdate((e) => {
      updateFromX(e.x);
    })
    .onEnd((e) => {
      hasCommittedRef.current = true;
      finishAt(e.x);
    })
    .onFinalize((e) => {
      // se o gesto já foi finalizado normalmente pelo onEnd,
      // não faz nada de novo aqui
      if (hasCommittedRef.current) {
        return;
      }

      // só cai aqui se o gesto foi cancelado ANTES de soltar
      // o dedo direito (ex: interrompido pelo sistema)
      setDragProgress(null);
      onSeekEndRef.current?.();
    });

  const visualProgress =
    dragProgress !== null ? dragProgress : progress;

  return (
    <View style={{ width: 245 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Pressable
          onPress={onPlayPause}
          style={{
            width:42,
            height:42,
            borderRadius:21,
            justifyContent:"center",
            alignItems:"center",
            backgroundColor:isMine
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

        <GestureDetector gesture={panGesture}>
          <View
            onLayout={(event) => {
              widthRef.current = event.nativeEvent.layout.width;
            }}
            style={{
              flex:1,
              marginLeft:12,
              height:44,
              flexDirection:"row",
              alignItems:"center",
              justifyContent:"space-evenly",
            }}
          >
            {bars.map((height,index)=>{

              const active = index < visualProgress * bars.length;

              return(
                <View
                  key={index}
                  style={{
                    width:3,
                    marginHorizontal:.8,
                    height,
                    borderRadius:3,
                    backgroundColor:
                      active
                      ? isMine
                        ? "#FFF"
                        : "#1677FF"
                      : isMine
                      ? "rgba(255,255,255,.28)"
                      : "#D8DCE5",
                  }}
                />
              )

            })}
          </View>
        </GestureDetector>
      </View>

      <View
        style={{
          marginTop:8,
          paddingLeft:54,
          flexDirection:"row",
          justifyContent:"space-between",
          alignItems:"center",
        }}
      >
        <Text style={{ fontSize:11, color:isMine ? "#FFF" : "#666" }}>
          {currentTime} / {duration}
        </Text>

        <View style={{ flexDirection:"row", alignItems:"center" }}>
          <Pressable onPress={onChangeSpeed}>
            <Text
              style={{
                fontWeight:"700",
                marginRight:8,
                color:isMine ? "#FFF" : "#1677FF",
              }}
            >
              {playbackRate}x
            </Text>
          </Pressable>

          <Text style={{ fontSize:11, color:isMine ? "#FFF" : "#666" }}>
            {messageTime}
          </Text>

          {status && (
            <Ionicons
              style={{ marginLeft:4 }}
              name={status==="sent" ? "checkmark" : "checkmark-done"}
              size={15}
              color={
                status==="read"
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