import { useEffect } from 'react';
import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';
// This hook is intended for native apps to prompt for app store reviews.

const LAUNCH_COUNT_KEY = 'app_launch_count';
const REVIEWED_KEY = 'app_reviewed';
const MIN_LAUNCHES_FOR_REVIEW = 5; // Minimum launches before prompting

/**
 * Custom hook to manage prompting users for app store reviews.
 * It tracks app launches and only prompts if certain conditions are met.
 * This hook should be called from a top-level component, e.g., App.tsx.
 */
export function useReviewPrompt() {
  useEffect(() => {
    const incrementLaunchCount = async () => {
      try {
        const reviewed = await AsyncStorage.getItem(REVIEWED_KEY);
        if (reviewed === 'true') {
          return; // Already reviewed, no need to prompt again
        }

        const currentCountStr = await AsyncStorage.getItem(LAUNCH_COUNT_KEY);
        let currentCount = parseInt(currentCountStr || '0', 10);
        currentCount++;
        await AsyncStorage.setItem(LAUNCH_COUNT_KEY, currentCount.toString());

        if (currentCount >= MIN_LAUNCHES_FOR_REVIEW) {
          const isAvailable = await StoreReview.isAvailableAsync();
          if (isAvailable) {
            console.log('Prompting for review...');
            await StoreReview.requestReview();
            // Mark as reviewed to prevent future prompts
            await AsyncStorage.setItem(REVIEWED_KEY, 'true');
          } else {
            console.log('Store review not available on this device.');
          }
        }
      } catch (error) {
        console.error('Failed to manage review prompt:', error);
      }
    };

    incrementLaunchCount();
  }, []);
}
