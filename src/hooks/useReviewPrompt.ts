```diff
--- a/src/hooks/useReviewPrompt.ts
+++ b/src/hooks/useReviewPrompt.ts
@@ -1,6 +1,7 @@
 import { useEffect } from 'react';
 import * as StoreReview from 'expo-store-review';
 import AsyncStorage from '@react-native-async-storage/async-storage';
+// This hook is intended for native apps to prompt for app store reviews.
 
 const LAUNCH_COUNT_KEY = 'app_launch_count';
 const REVIEWED_KEY = 'app_reviewed';
```
