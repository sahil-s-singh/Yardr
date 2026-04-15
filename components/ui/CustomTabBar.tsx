import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { router, usePathname } from "expo-router";
import React from "react";
import {
	Platform,
	StyleSheet,
	TouchableOpacity,
	View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const TABS = [
	{ key: "index", icon: "home" as const, route: "/(tabs)" },
	{ key: "wishlists", icon: "local-offer" as const, route: "/wishlists" },
	{ key: "sell", icon: "add" as const, route: "/sell" },
	{ key: "search", icon: "search" as const, route: "/(tabs)/search" },
	{ key: "profile", icon: "person-outline" as const, route: "/(tabs)/profile" },
];

const ACTIVE_BG = "rgba(223,107,79,0.12)";
const ACTIVE_COLOR = "#DF6B4F";
const INACTIVE_COLOR = "#807A73";

export default function CustomTabBar() {
	const pathname = usePathname();

	const getActiveKey = () => {
		if (pathname === "/" || pathname === "/index") return "index";
		if (pathname.startsWith("/wishlist")) return "wishlists";
		if (pathname === "/profile") return "profile";
		if (pathname === "/search") return "search";
		if (pathname.startsWith("/sell")) return "sell";
		return "index";
	};

	const activeKey = getActiveKey();

	return (
		<View style={styles.container}>
			<View style={styles.pill}>
				{Platform.OS === "ios" ? (
					<BlurView
						intensity={40}
						tint="light"
						style={StyleSheet.absoluteFill}
					/>
				) : null}
				<View style={styles.androidBg} />

				<View style={styles.tabsRow}>
					{TABS.map((tab) => {
						const isActive = activeKey === tab.key;
						const isCenter = tab.key === "sell";

						if (isCenter) {
							return (
								<TouchableOpacity
									key={tab.key}
									style={styles.centerBtn}
									activeOpacity={0.85}
									onPress={() => router.push("/sell" as any)}
								>
									<LinearGradient
										colors={["#DF6B4F", "#F9AD85"]}
										start={{ x: 0, y: 0 }}
										end={{ x: 1, y: 1 }}
										style={styles.centerGradient}
									>
										<MaterialIcons name="add" size={22} color="#FFFFFF" />
									</LinearGradient>
								</TouchableOpacity>
							);
						}

						return (
							<TouchableOpacity
								key={tab.key}
								style={[
									styles.tabBtn,
									isActive && { backgroundColor: ACTIVE_BG },
								]}
								activeOpacity={0.7}
								onPress={() => router.push(tab.route as any)}
							>
								<MaterialIcons
									name={tab.icon}
									size={22}
									color={isActive ? ACTIVE_COLOR : INACTIVE_COLOR}
								/>
							</TouchableOpacity>
						);
					})}
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		position: "absolute",
		bottom: 28,
		left: 20,
		right: 20,
	},
	pill: {
		height: 58,
		borderRadius: 29,
		overflow: "hidden",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.1,
		shadowRadius: 24,
		elevation: 8,
	},
	androidBg: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(255,255,255,0.85)",
		borderRadius: 29,
	},
	tabsRow: {
		...StyleSheet.absoluteFillObject,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 20,
	},
	tabBtn: {
		width: 42,
		height: 42,
		borderRadius: 21,
		alignItems: "center",
		justifyContent: "center",
	},
	centerBtn: {
		width: 42,
		height: 42,
		borderRadius: 21,
		shadowColor: "#DF6B4F",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.35,
		shadowRadius: 12,
		elevation: 6,
	},
	centerGradient: {
		width: 42,
		height: 42,
		borderRadius: 21,
		alignItems: "center",
		justifyContent: "center",
	},
});
