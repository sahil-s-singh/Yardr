import { IconSymbol } from "@/components/ui/icon-symbol";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function SellSuccess() {
	return (
		<View style={styles.safe}>
			<View style={styles.card}>
				<View style={styles.iconWrap}>
					<IconSymbol size={28} name="checkmark.circle.fill" color="#2E7D32" />
				</View>

				<Text style={styles.title}>Your sale is live</Text>
				<Text style={styles.subtitle}>
					It’s been published successfully. You can view it in My Sales or go
					back home.
				</Text>

				<TouchableOpacity
					style={styles.primaryBtn}
					onPress={() => router.replace("/my-sales")}
					activeOpacity={0.92}
				>
					<Text style={styles.primaryText}>View My Sales</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.secondaryBtn}
					onPress={() => router.replace("/")}
					activeOpacity={0.92}
				>
					<Text style={styles.secondaryText}>Go Home</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	safe: {
		flex: 1,
		backgroundColor: "#FAF7F2",
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 18,
	},
	card: {
		width: "100%",
		backgroundColor: "#FFF",
		borderRadius: 22,
		borderWidth: 1,
		borderColor: "#E6E1DA",
		padding: 20,
	},
	iconWrap: {
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: "#EAF6EC",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 14,
	},
	title: { fontSize: 22, fontWeight: "800", color: "#1F1F1F" },
	subtitle: {
		marginTop: 8,
		fontSize: 15,
		lineHeight: 20,
		color: "#6B625A",
	},

	primaryBtn: {
		marginTop: 18,
		height: 56,
		borderRadius: 28,
		backgroundColor: "#D97B3F",
		alignItems: "center",
		justifyContent: "center",
	},
	primaryText: { color: "#FFF", fontSize: 18, fontWeight: "800" },

	secondaryBtn: {
		marginTop: 12,
		height: 56,
		borderRadius: 28,
		backgroundColor: "#F1EDE6",
		borderWidth: 1,
		borderColor: "#E6E1DA",
		alignItems: "center",
		justifyContent: "center",
	},
	secondaryText: { color: "#1F1F1F", fontSize: 16, fontWeight: "800" },
});
