module.exports = {
  preset: "jest-expo",
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@supabase/.*)",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  setupFiles: ["<rootDir>/__tests__/setup.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/supabase/", "/__tests__/setup.ts", "/__tests__/mocks/"],
  collectCoverageFrom: [
    "lib/**/*.{ts,tsx}",
    "services/**/*.{ts,tsx}",
    "contexts/**/*.{ts,tsx}",
    "!**/*.d.ts",
  ],
};
