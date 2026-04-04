// app/(tabs)/_layout.tsx
import CustomTabBar from "@/components/ui/CustomTabBar";
import { Tabs } from "expo-router";
import React from "react";

export default function TabLayout() {
	return (
		<>
			<Tabs
				screenOptions={{
					headerShown: false,
					tabBarStyle: { display: "none" },
				}}
			>
				<Tabs.Screen name="index" options={{ title: "Home" }} />
				<Tabs.Screen name="map" options={{ title: "Map" }} />
				<Tabs.Screen name="search" options={{ title: "Search" }} />
				<Tabs.Screen name="profile" options={{ title: "Profile" }} />
			</Tabs>
			<CustomTabBar />
		</>
	);
}
