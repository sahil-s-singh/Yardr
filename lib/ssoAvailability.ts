// SSO availability per provider. Google uses expo-auth-session web flow so
// only requires a Web Client ID — works in Expo Go and dev builds equally.
// Apple uses native expo-apple-authentication so requires a dev build on iOS.

import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';

const isExpoGo = Constants.appOwnership === 'expo';

const googleConfigured = !!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

const appleNative =
  !isExpoGo &&
  Platform.OS === 'ios' &&
  !!(NativeModules as any).ExpoAppleAuthentication;

export const sso = {
  googleNativeAvailable: googleConfigured,
  appleNativeAvailable: appleNative,
};
