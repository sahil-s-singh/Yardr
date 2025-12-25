import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function FloatingActionButton({
	onPress,
}: {
	onPress: () => void;
}) {
	const colorScheme = useColorScheme();
	const theme = Colors[colorScheme ?? "light"];

	return (
		<View style={styles.wrap} pointerEvents="box-none">
			<TouchableOpacity
				style={[styles.btn, { backgroundColor: theme.tint }]}
				activeOpacity={0.9}
				onPress={onPress}
			>
				<IconSymbol size={26} name="plus" color="#FFFFFF" />
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {
		position: "absolute",
		right: 18,
		bottom: 104,
	},
	btn: {
		width: 64,
		height: 64,
		borderRadius: 999,
		alignItems: "center",
		justifyContent: "center",
		shadowColor: "#000",
		shadowOpacity: 0.18,
		shadowRadius: 18,
		shadowOffset: { width: 0, height: 10 },
		elevation: 6,
	},
});
