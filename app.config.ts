import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  return {
    ...config,
    name: config.name || "Yardr",
    slug: config.slug || "yardr",
    ios: {
      ...config.ios,
      config: {
        googleMapsApiKey,
      },
      infoPlist: {
        ...((config.ios as any)?.infoPlist || {}),
        NSPhotoLibraryUsageDescription:
          "Yardr needs access to your photo library so you can select photos of items for sale when creating a garage sale listing. For example, you can pick a photo of your furniture or electronics to show buyers what's available.",
        NSMicrophoneUsageDescription:
          "Allow Yardr to use your microphone to record sale videos with audio.",
      },
    },
    android: {
      ...config.android,
      config: {
        ...((config.android as any)?.config || {}),
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
  };
};
