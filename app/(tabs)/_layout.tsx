import { Tabs, router } from "expo-router";
import React from "react";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
	const colorScheme = useColorScheme();
	const theme = Colors[colorScheme ?? "light"];

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: theme.tabIconSelected,
				tabBarInactiveTintColor: theme.tabIconDefault,
				tabBarStyle: {
					backgroundColor: theme.card,
					borderTopColor: theme.border,
					borderTopWidth: 1,
					height: 88,
					paddingTop: 8,
					paddingBottom: 20,
				},
				tabBarLabelStyle: {
					fontSize: 12,
					fontWeight: "600",
				},
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Discover",
					tabBarIcon: ({ color }) => (
						<IconSymbol size={28} name="house.fill" color={color} />
					),
				}}
			/>

			<Tabs.Screen
				name="map"
				options={{
					title: "Map",
					tabBarIcon: ({ color }) => (
						<IconSymbol size={28} name="map.fill" color={color} />
					),
				}}
			/>

			{/* Dummy screen for Sell tab - intercepts and redirects */}
			<Tabs.Screen
				name="sell"
				options={{
					title: "Sell",
					tabBarIcon: ({ color }) => (
						<IconSymbol size={32} name="plus.circle.fill" color={color} />
					),
				}}
				listeners={{
					tabPress: (e) => {
						// Prevent default navigation
						e.preventDefault();
						// Navigate to the modal sell flow
						router.push("/add-sale");
					},
				}}
			/>

			<Tabs.Screen
				name="profile"
				options={{
					title: "Profile",
					tabBarIcon: ({ color }) => (
						<IconSymbol size={28} name="person.fill" color={color} />
					),
				}}
			/>
		</Tabs>
	);
}
