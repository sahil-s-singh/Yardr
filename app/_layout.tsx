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
						options={{ headerShown: true, title: "Sign In" }}
					/>
					<Stack.Screen
						name="auth/sign-up"
						options={{ headerShown: true, title: "Sign Up" }}
					/>

					{/* User Features */}
					<Stack.Screen
						name="favorites"
						options={{ headerShown: true, title: "My Favorites" }}
					/>
					<Stack.Screen
						name="reminders"
						options={{ headerShown: true, title: "My Reminders" }}
					/>
					<Stack.Screen
						name="history"
						options={{ headerShown: true, title: "View History" }}
					/>
					<Stack.Screen
						name="my-sales"
						options={{ headerShown: true, title: "My Garage Sales" }}
					/>

					{/* Edit Features */}
					<Stack.Screen
						name="edit-sale/[id]"
						options={{ headerShown: true, title: "Edit Sale" }}
					/>
					<Stack.Screen
						name="add-video/[id]"
						options={{ headerShown: true, title: "Add Video" }}
					/>

					{/* Keep old route for backward compatibility */}
					<Stack.Screen
						name="add-garage-sale"
						options={{ headerShown: false }}
					/>
				</Stack>
				<StatusBar style="auto" />
			</ThemeProvider>
		</AuthProvider>
	);
}
