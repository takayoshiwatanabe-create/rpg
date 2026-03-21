import { Audio } from "expo-av";

// Define sound assets
export const SOUND_ASSETS = {
  buttonTap: require("../../assets/sounds/button_tap.mp3"),
  questStart: require("../../assets/sounds/quest_start.mp3"),
  battleAttack: require("../../assets/sounds/battle_attack.mp3"),
  levelUp: require("../../assets/sounds/level_up.mp3"),
  goldGet: require("../../assets/sounds/gold_get.mp3"),
  itemGet: require("../../assets/sounds/item_get.mp3"),
  messageAdvance: require("../../assets/sounds/message_advance.mp3"),
  confirm: require("../../assets/sounds/confirm.mp3"),
  cancel: require("../../assets/sounds/cancel.mp3"),
  error: require("../../assets/sounds/error.mp3"),
  victory: require("../../assets/sounds/victory.mp3"),
};

// Pre-load sounds for faster playback
type SoundObjects = { [key in keyof typeof SOUND_ASSETS]: Audio.Sound | null };
const soundObjects: SoundObjects = Object.fromEntries(
  Object.keys(SOUND_ASSETS).map((key) => [key, null])
) as SoundObjects;

export async function loadSounds() {
  for (const key in SOUND_ASSETS) {
    const assetKey = key as keyof typeof SOUND_ASSETS;
    try {
      const { sound } = await Audio.Sound.createAsync(SOUND_ASSETS[assetKey], { shouldPlay: false });
      soundObjects[assetKey] = sound;
    } catch (error) {
      console.warn(`Failed to load sound ${assetKey}:`, error);
    }
  }
}

export async function unloadSounds() {
  for (const key in soundObjects) {
    const assetKey = key as keyof typeof soundObjects;
    if (soundObjects[assetKey]) {
      await soundObjects[assetKey]?.unloadAsync();
      soundObjects[assetKey] = null;
    }
  }
}

export async function playSound(key: keyof typeof SOUND_ASSETS) {
  const sound = soundObjects[key];
  if (sound) {
    try {
      // Stop and replay to ensure it plays from the beginning even if already playing
      await sound.stopAsync();
      await sound.replayAsync();
    } catch (error) {
      console.warn(`Failed to play sound ${key}:`, error);
    }
  } else {
    console.warn(`Sound ${key} is not loaded.`);
  }
}
