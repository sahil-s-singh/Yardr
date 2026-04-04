//app/sell/_layout.tsx
import { Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialIcons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import React, { useEffect } from "react";
import {
	SafeAreaView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

export default function SellLayout() {
	const { user } = useAuth();
	const colorScheme = useColorScheme();
	const theme = Colors[colorScheme ?? "light"];

	// Not logged in — show prompt
	if (!user) {
		return (
			<SafeAreaView
				style={[styles.safe, { backgroundColor: theme.background }]}
			>
				<View style={styles.center}>
					<MaterialIcons name="lock-outline" size={48} color={theme.secondaryText} />
					<Text style={[styles.title, { color: theme.text }]}>
						Sign in to post a sale
					</Text>
					<Text style={[styles.sub, { color: theme.secondaryText }]}>
						You need an account to create and manage garage sales.
					</Text>
					<TouchableOpacity
						style={[styles.btn, { backgroundColor: theme.tint }]}
						onPress={() => router.replace("/auth/sign-in")}
					>
						<Text style={styles.btnText}>Sign In</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.backBtn}
						onPress={() => router.back()}
					>
						<Text style={[styles.backText, { color: theme.secondaryText }]}>
							Go Back
						</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen name="index" />
			<Stack.Screen name="video" />
			<Stack.Screen name="publish" />
			<Stack.Screen name="success" />
		</Stack>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1 },
	center: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 40,
	},
	title: {
		fontSize: 20,
		fontWeight: "700",
		marginTop: 16,
	},
	sub: {
		fontSize: 15,
		textAlign: "center",
		marginTop: 8,
		lineHeight: 22,
	},
	btn: {
		marginTop: 24,
		borderRadius: 18,
		paddingVertical: 14,
		paddingHorizontal: 28,
	},
	btnText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "700",
	},
	backBtn: {
		marginTop: 12,
		padding: 10,
	},
	backText: {
		fontSize: 14,
		fontWeight: "600",
	},
});
