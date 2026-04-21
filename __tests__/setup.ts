// Global test setup - mock native modules and external dependencies

// Mock expo-notifications
jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: "ExponentPushToken[mock-token]" }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue("mock-notification-id"),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  SchedulableTriggerInputTypes: { DATE: "date" },
}));

// Mock expo-device
jest.mock("expo-device", () => ({
  isDevice: true,
}));

// Mock expo-location
jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: { latitude: 52.1332, longitude: -106.67 },
  }),
  geocodeAsync: jest.fn().mockResolvedValue([]),
  reverseGeocodeAsync: jest.fn().mockResolvedValue([]),
}));

// Mock expo-video-thumbnails
jest.mock("expo-video-thumbnails", () => ({
  getThumbnailAsync: jest.fn().mockResolvedValue({ uri: "file://mock-thumbnail.jpg" }),
}));

// Mock expo-file-system
jest.mock("expo-file-system/legacy", () => ({
  readAsStringAsync: jest.fn().mockResolvedValue("mock-base64-string"),
  EncodingType: { Base64: "base64" },
}));

// Mock expo-camera
jest.mock("expo-camera", () => ({
  CameraView: "CameraView",
  useCameraPermissions: jest.fn().mockReturnValue([{ granted: true }, jest.fn()]),
}));

// Mock base64-arraybuffer
jest.mock("base64-arraybuffer", () => ({
  decode: jest.fn().mockReturnValue(new ArrayBuffer(8)),
}));

// Mock expo-router
jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  },
  useLocalSearchParams: jest.fn().mockReturnValue({}),
  useFocusEffect: jest.fn(),
  Stack: "Stack",
  Link: "Link",
}));

// Mock global fetch
global.fetch = jest.fn();
