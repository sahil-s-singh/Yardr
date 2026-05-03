// app/_layout.tsx
import SplashLoader from "@/components/SplashLoader";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import {
	addNotificationReceivedListener,
	addNotificationResponseListener,
	initializeNotifications,
} from "@/lib/notifications";
import { notificationHistory } from "@/lib/notificationHistory";
import { Stack, router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

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

		const responseSub = addNotificationResponseListener(async (response) => {
			const req = response.notification.request;
			const content = req.content;
			const data = content.data;
			try {
				const existing = await notificationHistory.list();
				if (!existing.some((n) => n.id === req.identifier)) {
					await notificationHistory.append({
						id: req.identifier,
						title: content.title ?? "Notification",
						body: content.body ?? "",
						data: (data as Record<string, any>) ?? undefined,
						read: true,
					});
				} else {
					await notificationHistory.markAsRead(req.identifier);
				}
			} catch (err) {
				console.error("Failed to record notification response:", err);
			}
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
			<RootStack />
		</AuthProvider>
	);
}

function RootStack() {
	const { loading } = useAuth();
	if (loading) {
		return (
			<View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
				<ActivityIndicator />
			</View>
		);
	}
	return (
		<Stack screenOptions={{ headerShown: false }}>
			{/* Expo Router will auto-register routes */}
		</Stack>
	);
}
