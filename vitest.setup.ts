import '@testing-library/react-native/extend-expect';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react-native';

// Mock react-native-gesture-handler
// This is often needed for components that use gesture handlers
// global.__reanimatedWorkletInit = () => {}; // If using Reanimated 2+

// Mock expo-router's useLocalSearchParams and router
// This is a common pattern for testing components that use expo-router
vi.mock('expo-router', () => ({
  useLocalSearchParams: vi.fn(() => ({})),
  router: {
    replace: vi.fn(),
    push: vi.fn(),
    back: vi.fn(),
  },
  Stack: {
    Screen: vi.fn(() => null),
  },
}));

// Mock expo-localization for i18n
vi.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en', regionCode: 'US' }],
}));

// Mock react-native-safe-area-context
vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock react-native-screens
vi.mock('react-native-screens', () => ({
  enableScreens: vi.fn(),
}));

// Mock Animated for React Native
vi.mock('react-native', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-native')>();
  return {
    ...actual,
    Animated: {
      ...actual.Animated,
      spring: vi.fn(() => ({
        start: vi.fn(),
      })),
      Value: vi.fn((initialValue) => ({
        _value: initialValue,
        setValue: vi.fn(function (this: any, val) { this._value = val; }),
        interpolate: vi.fn(() => 1), // Mock interpolate to return 1 for simplicity
      })),
    },
    Alert: {
      alert: vi.fn(),
    },
    BackHandler: {
      addEventListener: vi.fn(() => ({ remove: vi.fn() })),
    },
    // Mock Platform for web/native specific logic
    Platform: {
      OS: 'web', // or 'ios', 'android' depending on what you want to test
      select: ({ web, default: _default }: { web?: any; default?: any }) => web || _default,
    },
    I18nManager: {
      isRTL: false,
      forceRTL: vi.fn(),
      allowRTL: vi.fn(),
    },
  };
});


// Cleans up after each test run
afterEach(() => {
  cleanup();
});

// If you have global mocks or setup that needs to run once
beforeAll(() => {
  // For example, if you need to mock Firebase or other global services
});

afterAll(() => {
  // Cleanup global mocks if necessary
});
