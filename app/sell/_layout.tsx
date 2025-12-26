// app/sell/_layout.tsx
import { Stack } from "expo-router";
import React from "react";

export default function SellLayout() {
	return (
		<Stack
			screenOptions={{
				headerShown: false,
			}}
		>
			<Stack.Screen name="index" />
			<Stack.Screen name="video" />
			<Stack.Screen name="publish" />
			<Stack.Screen name="success" />
		</Stack>
	);
}
