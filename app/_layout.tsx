// app/_layout.tsx
import SplashLoader from "@/components/SplashLoader";
import { AuthProvider } from "@/contexts/AuthContext";
import {
	initializeNotifications,
	addNotificationResponseListener,
} from "@/lib/notifications";
import { Stack, router } from "expo-router";
import React, { useEffect, useState } from "react";

export default function RootLayout() {
	const [splashDone, setSplashDone] = useState(false);

	useEffect(() => {
		initializeNotifications();

		const sub = addNotificationResponseListener((response) => {
			const data = response.notification.request.content.data;
			if (data?.garageSaleId) {
				router.push(`/sale-detail/${data.garageSaleId}`);
			}
		});

		return () => sub.remove();
	}, []);

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
