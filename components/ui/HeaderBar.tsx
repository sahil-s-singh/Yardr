import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function HeaderBar() {
	const colorScheme = useColorScheme();
	const theme = Colors[colorScheme ?? "light"];

	return (
		<View style={[styles.wrap, { backgroundColor: theme.background }]}>
			<View style={styles.left}>
				<View style={[styles.logoBox, { backgroundColor: theme.tint }]}>
					<View style={styles.logoDot} />
				</View>
				<Text style={[styles.brand, { color: theme.tint }]}>Yardr</Text>
			</View>

			<View style={styles.right}>
				<TouchableOpacity style={styles.iconBtn} activeOpacity={0.8}>
					<IconSymbol
						size={22}
						name="magnifyingglass"
						color={theme.secondaryText}
					/>
				</TouchableOpacity>

				<TouchableOpacity style={styles.iconBtn} activeOpacity={0.8}>
					<IconSymbol size={22} name="bell" color={theme.secondaryText} />
					<View style={[styles.badge, { backgroundColor: theme.tint }]} />
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {
		paddingHorizontal: 18,
		paddingTop: 10,
		paddingBottom: 6,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	left: { flexDirection: "row", alignItems: "center", gap: 10 },
	logoBox: {
		width: 40,
		height: 40,
		borderRadius: 10,
		alignItems: "center",
		justifyContent: "center",
	},
	logoDot: {
		width: 10,
		height: 10,
		borderRadius: 999,
		backgroundColor: "rgba(255,255,255,0.9)",
	},
	brand: { fontSize: 26, fontWeight: "800", letterSpacing: -0.2 },

	right: { flexDirection: "row", alignItems: "center", gap: 10 },
	iconBtn: {
		width: 40,
		height: 40,
		alignItems: "center",
		justifyContent: "center",
	},
	badge: {
		position: "absolute",
		top: 9,
		right: 10,
		width: 9,
		height: 9,
		borderRadius: 999,
		borderWidth: 2,
		borderColor: "#FAF7F2",
	},
});
