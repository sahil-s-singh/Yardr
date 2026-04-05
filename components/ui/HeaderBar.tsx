import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import LogoIcon from "@/assets/splash/logo-center.svg";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface HeaderBarProps {
	mode?: "map" | "list";
	onToggleMode?: (mode: "map" | "list") => void;
}

export default function HeaderBar({ mode, onToggleMode }: HeaderBarProps) {
	const colorScheme = useColorScheme();
	const theme = Colors[colorScheme ?? "light"];

	return (
		<View style={styles.wrap}>
			{/* Left — tiny Map/List switch */}
			{mode && onToggleMode ? (
				<View style={[styles.switchTrack, { backgroundColor: theme.muted }]}>
					<TouchableOpacity
						style={[
							styles.switchPill,
							mode === "map" && { backgroundColor: theme.card },
						]}
						activeOpacity={0.8}
						onPress={() => onToggleMode("map")}
					>
						<Text
							style={[
								styles.switchLabel,
								{ color: mode === "map" ? theme.text : theme.secondaryText },
							]}
						>
							Map
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[
							styles.switchPill,
							mode === "list" && { backgroundColor: theme.card },
						]}
						activeOpacity={0.8}
						onPress={() => onToggleMode("list")}
					>
						<Text
							style={[
								styles.switchLabel,
								{ color: mode === "list" ? theme.text : theme.secondaryText },
							]}
						>
							List
						</Text>
					</TouchableOpacity>
				</View>
			) : (
				<View style={{ width: 46 }} />
			)}

			{/* Center — Logo sits left of "yardr" so the word stays centered */}
			<View style={styles.center}>
				<LogoIcon width={26} height={26} style={styles.logo} />
				<Text style={styles.brand}>yardr</Text>
			</View>

			{/* Right — Notification bell */}
			<TouchableOpacity style={styles.iconBtn} activeOpacity={0.8}>
				<MaterialIcons
					name="notifications-none"
					size={22}
					color={theme.secondaryText}
				/>
				<View
					style={[
						styles.badge,
						{
							backgroundColor: theme.tint,
							borderColor: theme.background,
						},
					]}
				/>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {
		paddingHorizontal: 16,
		paddingTop: 8,
		paddingBottom: 6,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	switchTrack: {
		flexDirection: "row",
		borderRadius: 8,
		padding: 2,
	},
	switchPill: {
		paddingVertical: 2,
		paddingHorizontal: 6,
		borderRadius: 6,
	},
	switchLabel: {
		fontSize: 10,
		fontWeight: "600",
	},
	center: {
		position: "absolute",
		left: 0,
		right: 0,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
	},
	logo: {
		marginRight: 5,
	},
	brand: {
		fontSize: 22,
		fontWeight: "900",
		letterSpacing: -0.3,
		color: "#DF6B4F",
	},
	iconBtn: {
		width: 36,
		height: 36,
		alignItems: "center",
		justifyContent: "center",
	},
	badge: {
		position: "absolute",
		top: 6,
		right: 6,
		width: 8,
		height: 8,
		borderRadius: 999,
		borderWidth: 2,
	},
});
