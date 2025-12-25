// app/_layout.tsx
import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { AuthProvider } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { initializeNotifications } from "@/lib/notifications";

export const unstable_settings = {
	anchor: "(tabs)",
};

export default function RootLayout() {
	const colorScheme = useColorScheme();

	useEffect(() => {
		initializeNotifications();
	}, []);

	return (
		<AuthProvider>
			<ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
				<Stack>
					<Stack.Screen name="(tabs)" options={{ headerShown: false }} />

					{/* Sale Detail - New Screen */}
					<Stack.Screen
						name="sale-detail/[id]"
						options={{
							headerShown: true,
							title: "Sale Details",
							presentation: "card",
							headerStyle: {
								backgroundColor: "#0A0A0A",
							},
							headerTintColor: "#FFF",
						}}
					/>

					{/* Add Sale - Streamlined */}
					<Stack.Screen
						name="add-sale"
						options={{
							headerShown: false,
							presentation: "fullScreenModal",
						}}
					/>

					{/* Auth Screens */}
					<Stack.Screen
						name="auth/sign-in"
						options={{
							headerShown: true,
							title: "Sign In",
							headerStyle: {
								backgroundColor: "#0A0A0A",
							},
							headerTintColor: "#FFF",
						}}
					/>
					<Stack.Screen
						name="auth/sign-up"
						options={{
							headerShown: true,
							title: "Sign Up",
							headerStyle: {
								backgroundColor: "#0A0A0A",
							},
							headerTintColor: "#FFF",
						}}
					/>

					{/* User Features - These files should exist in your app/ folder */}
					<Stack.Screen
						name="my-sales"
						options={{
							headerShown: true,
							title: "My Garage Sales",
							headerStyle: {
								backgroundColor: "#0A0A0A",
							},
							headerTintColor: "#FFF",
						}}
					/>

					{/* Edit Features */}
					<Stack.Screen
						name="edit-sale/[id]"
						options={{
							headerShown: true,
							title: "Edit Sale",
							headerStyle: {
								backgroundColor: "#0A0A0A",
							},
							headerTintColor: "#FFF",
						}}
					/>
					<Stack.Screen
						name="add-video/[id]"
						options={{
							headerShown: true,
							title: "Add Video",
							headerStyle: {
								backgroundColor: "#0A0A0A",
							},
							headerTintColor: "#FFF",
						}}
					/>

					{/* Keep old routes for backward compatibility */}
					<Stack.Screen
						name="add-garage-sale"
						options={{
							headerShown: false,
							headerStyle: {
								backgroundColor: "#0A0A0A",
							},
							headerTintColor: "#FFF",
						}}
					/>

					{/* Modal and other screens */}
					<Stack.Screen
						name="modal"
						options={{
							presentation: "modal",
							title: "Modal",
							headerStyle: {
								backgroundColor: "#0A0A0A",
							},
							headerTintColor: "#FFF",
						}}
					/>
				</Stack>
				<StatusBar style="light" />
			</ThemeProvider>
		</AuthProvider>
	);
}
