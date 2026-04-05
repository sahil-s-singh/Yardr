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
