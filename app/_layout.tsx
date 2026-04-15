// app/_layout.tsx
import SplashLoader from "@/components/SplashLoader";
import { AuthProvider } from "@/contexts/AuthContext";
import {
	addNotificationReceivedListener,
	addNotificationResponseListener,
	initializeNotifications,
} from "@/lib/notifications";
import { notificationHistory } from "@/lib/notificationHistory";
import { Stack, router } from "expo-router";
import React, { useEffect, useState } from "react";

export default function RootLayout() {
	const [splashDone, setSplashDone] = useState(false);

	useEffect(() => {
		initializeNotifications();

		const receivedSub = addNotificationReceivedListener((notification) => {
			const content = notification.request.content;
			notificationHistory
				.append({
					id: notification.request.identifier,
					title: content.title ?? "Notification",
					body: content.body ?? "",
					data: (content.data as Record<string, any>) ?? undefined,
				})
				.catch((err) =>
					console.error("Failed to persist notification history:", err),
				);
		});

		const responseSub = addNotificationResponseListener((response) => {
			const data = response.notification.request.content.data;
			notificationHistory
				.markAsRead(response.notification.request.identifier)
				.catch((err) => console.error("Failed to mark notification read:", err));
			if (data?.garageSaleId) {
				router.push(`/sale-detail/${data.garageSaleId}`);
			}
		});

		return () => {
			receivedSub.remove();
			responseSub.remove();
		};
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
