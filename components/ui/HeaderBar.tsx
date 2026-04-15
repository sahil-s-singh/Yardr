import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import LogoIcon from "@/assets/splash/logo-center.svg";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface HeaderBarProps {
	mode?: "map" | "list";
	onToggleMode?: (mode: "map" | "list") => void;
	wishlistActive?: boolean;
	onToggleWishlist?: () => void;
	wishlistCount?: number;
	unreadNotifications?: number;
}

export default function HeaderBar({
	mode,
	onToggleMode,
	wishlistActive,
	onToggleWishlist,
	wishlistCount,
	unreadNotifications = 0,
}: HeaderBarProps) {
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

			{/* Right — Wishlist filter + Notification bell */}
			<View style={styles.rightGroup}>
				{onToggleWishlist ? (
					<TouchableOpacity
						style={[
							styles.iconBtn,
							wishlistActive && {
								backgroundColor: `${theme.tint}1A`,
								borderRadius: 10,
							},
						]}
						activeOpacity={0.8}
						onPress={onToggleWishlist}
					>
						<MaterialIcons
							name="local-offer"
							size={20}
							color={wishlistActive ? theme.tint : theme.secondaryText}
						/>
						{wishlistCount && wishlistCount > 0 ? (
							<View
								style={[
									styles.countBadge,
									{
										backgroundColor: theme.tint,
										borderColor: theme.background,
									},
								]}
							>
								<Text style={styles.countBadgeText}>{wishlistCount}</Text>
							</View>
						) : null}
					</TouchableOpacity>
				) : null}

				<TouchableOpacity
					style={styles.iconBtn}
					activeOpacity={0.8}
					onPress={() => router.push("/notifications")}
				>
					<MaterialIcons
						name="notifications-none"
						size={22}
						color={theme.secondaryText}
					/>
					{unreadNotifications > 0 ? (
						<View
							style={[
								styles.badge,
								{
									backgroundColor: theme.tint,
									borderColor: theme.background,
								},
							]}
						/>
					) : null}
				</TouchableOpacity>
			</View>
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
	rightGroup: {
		flexDirection: "row",
		alignItems: "center",
		gap: 2,
	},
	iconBtn: {
		width: 36,
		height: 36,
		alignItems: "center",
		justifyContent: "center",
	},
	countBadge: {
		position: "absolute",
		top: 2,
		right: 2,
		minWidth: 16,
		height: 16,
		borderRadius: 999,
		borderWidth: 2,
		paddingHorizontal: 4,
		alignItems: "center",
		justifyContent: "center",
	},
	countBadgeText: {
		color: "#fff",
		fontSize: 9,
		fontWeight: "800",
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
