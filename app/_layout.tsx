import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ title: "シュクダイ・クエスト 〜勇者の宿題なぎ倒しRPG〜" }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
