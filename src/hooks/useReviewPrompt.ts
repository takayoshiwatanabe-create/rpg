import { useEffect } from 'react';
import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAUNCH_COUNT_KEY = 'app_launch_count';
const REVIEWED_KEY = 'app_reviewed';

export function useReviewPrompt() {
  useEffect(() => {
    checkAndPrompt();
  }, []);

  async function checkAndPrompt() {
    const reviewed = await AsyncStorage.getItem(REVIEWED_KEY);
    if (reviewed) return;

    const countStr = await AsyncStorage.getItem(LAUNCH_COUNT_KEY);
    const count = parseInt(countStr ?? '0') + 1;
    await AsyncStorage.setItem(LAUNCH_COUNT_KEY, count.toString());

    if (count === 5 || count === 15) {
      const isAvailable = await StoreReview.isAvailableAsync();
      if (isAvailable) {
        await StoreReview.requestReview();
        await AsyncStorage.setItem(REVIEWED_KEY, 'true');
      }
    }
  }
}
