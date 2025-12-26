// app/_layout.tsx
import { AuthProvider } from "@/contexts/AuthContext";
import { Stack } from "expo-router";
import React from "react";

export default function RootLayout() {
	return (
		<AuthProvider>
			<Stack screenOptions={{ headerShown: false }}>
				{/* Expo Router will auto-register routes */}
			</Stack>
		</AuthProvider>
	);
}
