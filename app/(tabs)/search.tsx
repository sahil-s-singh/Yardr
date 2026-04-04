import GradientBackground from "@/components/ui/GradientBackground";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function SearchTab() {
	const colorScheme = useColorScheme();
	const theme = Colors[colorScheme ?? "light"];

	return (
		<SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
			<GradientBackground />
			<View style={styles.content}>
				<Text style={[styles.title, { color: theme.text }]}>Search</Text>
				<View style={styles.center}>
					<MaterialIcons name="search" size={48} color={theme.secondaryText} />
					<Text style={[styles.subtitle, { color: theme.secondaryText }]}>
						Search for garage sales nearby
					</Text>
					<Text style={[styles.hint, { color: theme.secondaryText }]}>
						Coming soon
					</Text>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1 },
	content: { paddingHorizontal: 18, paddingTop: 6, flex: 1 },
	title: {
		fontSize: 28,
		fontWeight: "900",
		letterSpacing: -0.4,
		marginBottom: 12,
	},
	center: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingBottom: 100,
	},
	subtitle: {
		fontSize: 16,
		fontWeight: "600",
		marginTop: 12,
	},
	hint: {
		fontSize: 14,
		marginTop: 6,
	},
});
