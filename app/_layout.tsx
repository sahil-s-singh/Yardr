// app/_layout.tsx
import SplashLoader from "@/components/SplashLoader";
import { AuthProvider } from "@/contexts/AuthContext";
import { Stack } from "expo-router";
import React, { useState } from "react";

export default function RootLayout() {
	const [splashDone, setSplashDone] = useState(false);

	if (!splashDone) {
		return <SplashLoader onFinish={() => setSplashDone(true)} />;
	}

	return (
		<AuthProvider>
			<Stack screenOptions={{ headerShown: false }}>
				{/* Expo Router will auto-register routes */}
			</Stack>
		</AuthProvider>
	);
}
