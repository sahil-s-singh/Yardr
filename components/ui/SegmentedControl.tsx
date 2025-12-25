import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function SegmentedControl({
	value,
	onChange,
	leftLabel,
	rightLabel,
}: {
	value: "list" | "map";
	onChange: (v: "list" | "map") => void;
	leftLabel: string;
	rightLabel: string;
}) {
	const colorScheme = useColorScheme();
	const theme = Colors[colorScheme ?? "light"];

	const isLeft = value === "list";
	const isRight = value === "map";

	return (
		<View
			style={[
				styles.outer,
				{ backgroundColor: theme.muted, borderColor: theme.border },
			]}
		>
			<TouchableOpacity
				style={[
					styles.pill,
					isLeft && { backgroundColor: theme.card, borderColor: theme.border },
				]}
				activeOpacity={0.9}
				onPress={() => onChange("list")}
			>
				<IconSymbol size={18} name="list.bullet" color={theme.secondaryText} />
				<Text style={[styles.label, { color: theme.secondaryText }]}>
					{leftLabel}
				</Text>
			</TouchableOpacity>

			<TouchableOpacity
				style={[
					styles.pill,
					isRight && { backgroundColor: theme.card, borderColor: theme.border },
				]}
				activeOpacity={0.9}
				onPress={() => onChange("map")}
			>
				<IconSymbol size={18} name="map" color={theme.secondaryText} />
				<Text style={[styles.label, { color: theme.secondaryText }]}>
					{rightLabel}
				</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	outer: {
		borderWidth: 1,
		borderRadius: 18,
		padding: 6,
		flexDirection: "row",
		gap: 8,
	},
	pill: {
		flex: 1,
		borderRadius: 14,
		paddingVertical: 10,
		paddingHorizontal: 12,
		flexDirection: "row",
		gap: 10,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: "transparent",
	},
	label: { fontSize: 15, fontWeight: "700" },
});
