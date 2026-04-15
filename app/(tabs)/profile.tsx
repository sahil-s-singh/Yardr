// app/tabs/profile.tsx

import GradientBackground from "@/components/ui/GradientBackground";
import ProfileAuthSheet from "@/components/profile/ProfileAuthSheet";
import ProfileSignupSheet from "@/components/profile/ProfileSignupSheet";
import { Accent, Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { favoritesService } from "@/services/favoritesService";
import { getMySales } from "@/services/garageSaleService";
import { remindersService } from "@/services/remindersService";
import { MaterialIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
	Alert,
	SafeAreaView,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

const showComingSoon = (feature: string) => {
	Alert.alert("Coming soon!", `${feature} feature is coming soon.`, [
		{ text: "OK" },
	]);
};

type MenuItemType = {
	label: string;
	icon: keyof typeof MaterialIcons.glyphMap;
	route: string | null;
	color: string;
};

const menuItems: MenuItemType[] = [
	{ label: "Wishlist", icon: "local-offer", route: "/wishlists", color: Accent.peach },
	{ label: "Notifications", icon: "notifications-none", route: "/notifications", color: Accent.gold },
	{ label: "Settings", icon: "settings", route: null, color: Accent.indigo },
];

export default function ProfileScreen() {
	const { user, signOut } = useAuth();
	const colorScheme = useColorScheme();
	const theme = Colors[colorScheme ?? "light"];

	const [showLogin, setShowLogin] = useState(false);
	const [showSignup, setShowSignup] = useState(false);
	const [salesCount, setSalesCount] = useState(0);
	const [savedCount, setSavedCount] = useState(0);
	const [remindersCount, setRemindersCount] = useState(0);

	useFocusEffect(
		useCallback(() => {
			if (user) {
				const loadCounts = async () => {
					try {
						const [sales, favs, reminders] = await Promise.all([
							getMySales(user.id),
							favoritesService.getFavoritesCount(user.id).catch(() => 0),
							remindersService.getRemindersCount(user.id).catch(() => 0),
						]);
						setSalesCount(sales?.length || 0);
						setSavedCount(favs);
						setRemindersCount(reminders);
					} catch (error) {
						console.error("Error loading profile counts:", error);
						setSalesCount(0);
					}
				};
				loadCounts();
			}
		}, [user])
	);

	// LOGGED OUT
	if (!user) {
		return (
			<>
				<SafeAreaView
					style={[styles.safe, { backgroundColor: theme.background }]}
				>
					<GradientBackground />
					<View style={styles.container}>
						<View style={styles.centerBox}>
							<View
								style={[styles.avatar, { backgroundColor: theme.muted }]}
							>
								<MaterialIcons name="person" size={40} color={theme.secondaryText} />
							</View>
							<Text style={[styles.heading, { color: theme.text }]}>
								Sign in to yardr
							</Text>
							<Text style={[styles.sub, { color: theme.secondaryText }]}>
								Create and manage your sales, save favorites, and more.
							</Text>

							<TouchableOpacity
								style={[styles.primaryBtn, { backgroundColor: theme.tint }]}
								onPress={() => setShowLogin(true)}
							>
								<Text style={styles.primaryText}>Sign In or Sign Up</Text>
							</TouchableOpacity>
						</View>
					</View>
				</SafeAreaView>

				<ProfileAuthSheet
					visible={showLogin}
					onClose={() => setShowLogin(false)}
					onSwitchToSignup={() => {
						setShowLogin(false);
						setShowSignup(true);
					}}
				/>
				<ProfileSignupSheet
					visible={showSignup}
					onClose={() => setShowSignup(false)}
					onSwitchToLogin={() => {
						setShowSignup(false);
						setShowLogin(true);
					}}
				/>
			</>
		);
	}

	// LOGGED IN
	const stats = [
		{ label: "Sales", value: String(salesCount), icon: "style" as const, color: theme.tint },
		{ label: "Saved", value: String(savedCount), icon: "favorite" as const, color: Accent.sage },
		{ label: "Reminders", value: String(remindersCount), icon: "notifications" as const, color: Accent.indigo },
	];

	return (
		<SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
			<GradientBackground />
			<ScrollView
				style={styles.container}
				contentContainerStyle={{ paddingBottom: 120 }}
			>
				{/* Profile Card */}
				<View style={[styles.card, { backgroundColor: theme.card }]}>
					<View
						style={[styles.avatarLarge, { backgroundColor: theme.muted }]}
					>
						<MaterialIcons name="person" size={36} color={theme.secondaryText} />
					</View>
					<Text style={[styles.name, { color: theme.text }]}>
						{user.user_metadata?.display_name || "User"}
					</Text>
					<Text style={[styles.email, { color: theme.secondaryText }]}>
						{user.email}
					</Text>
				</View>

				{/* Stats Row */}
				<View style={styles.stats}>
					{stats.map((s) => (
						<View
							key={s.label}
							style={[styles.stat, { backgroundColor: theme.card }]}
						>
							<MaterialIcons name={s.icon} size={20} color={s.color} />
							<Text style={[styles.statValue, { color: s.color }]}>
								{s.value}
							</Text>
							<Text style={[styles.statLabel, { color: theme.secondaryText }]}>
								{s.label}
							</Text>
						</View>
					))}
				</View>

				{/* Menu Grid */}
				<View style={styles.menuGrid}>
					{menuItems.map((item) => (
						<TouchableOpacity
							key={item.label}
							style={[styles.menuTile, { backgroundColor: theme.card }]}
							onPress={() =>
								item.route
									? router.push(item.route as any)
									: showComingSoon(item.label)
							}
							activeOpacity={0.85}
						>
							<MaterialIcons name={item.icon} size={20} color={item.color} />
							<Text
								style={[styles.menuTileLabel, { color: item.color }]}
								numberOfLines={1}
								adjustsFontSizeToFit
								minimumFontScale={0.8}
							>
								{item.label}
							</Text>
						</TouchableOpacity>
					))}
				</View>

				{/* Sign Out */}
				<TouchableOpacity
					style={[
						styles.logout,
						{
							backgroundColor: `${theme.tint}14`,
							borderColor: `${theme.tint}33`,
						},
					]}
					onPress={signOut}
				>
					<Text style={[styles.logoutText, { color: theme.tint }]}>
						Sign Out
					</Text>
				</TouchableOpacity>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1 },
	container: { flex: 1, padding: 20 },

	centerBox: { alignItems: "center", marginTop: 80 },
	avatar: {
		width: 90,
		height: 90,
		borderRadius: 45,
		alignItems: "center",
		justifyContent: "center",
	},
	heading: { fontSize: 22, fontWeight: "700", marginTop: 20 },
	sub: { textAlign: "center", marginTop: 10, lineHeight: 22 },

	primaryBtn: {
		paddingHorizontal: 28,
		paddingVertical: 16,
		borderRadius: 18,
		marginTop: 30,
	},
	primaryText: { color: "#fff", fontSize: 16, fontWeight: "700" },

	card: {
		borderRadius: 22,
		padding: 24,
		alignItems: "center",
		marginBottom: 16,
	},
	avatarLarge: {
		width: 72,
		height: 72,
		borderRadius: 36,
		alignItems: "center",
		justifyContent: "center",
	},
	name: { fontSize: 20, fontWeight: "700", marginTop: 10 },
	email: { marginTop: 4, fontSize: 14 },

	stats: {
		flexDirection: "row",
		gap: 12,
		marginBottom: 16,
	},
	stat: {
		flex: 1,
		borderRadius: 18,
		padding: 16,
		alignItems: "center",
		justifyContent: "center",
		minHeight: 104,
	},
	statValue: { fontSize: 22, fontWeight: "900", marginTop: 4 },
	statLabel: { marginTop: 4, fontSize: 12, fontWeight: "600" },

	menuGrid: {
		flexDirection: "row",
		gap: 12,
		marginBottom: 16,
	},
	menuTile: {
		flex: 1,
		borderRadius: 18,
		padding: 16,
		alignItems: "center",
		justifyContent: "center",
		minHeight: 104,
	},
	menuTileLabel: {
		marginTop: 8,
		fontSize: 12,
		fontWeight: "700",
	},

	logout: {
		padding: 16,
		borderRadius: 18,
		borderWidth: 1,
		alignItems: "center",
	},
	logoutText: { fontWeight: "700", fontSize: 16 },
});
