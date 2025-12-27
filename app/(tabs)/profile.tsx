import ProfileAuthSheet from "@/components/profile/ProfileAuthSheet";
import ProfileMenuSheet from "@/components/profile/ProfileMenuSheet";
import ProfileSignupSheet from "@/components/profile/ProfileSignupSheet";
import { useAuth } from "@/contexts/AuthContext";
import { router } from "expo-router";
import { useState } from "react";
import {
	Alert,
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

export default function ProfileScreen() {
	const { user, signOut } = useAuth();

	const [showLogin, setShowLogin] = useState(false);
	const [showSignup, setShowSignup] = useState(false);
	const [showMenu, setShowMenu] = useState(false);

	// ---------------------------
	// LOGGED OUT VIEW
	// ---------------------------
	if (!user) {
		return (
			<>
				<View style={styles.container}>
					<Text style={styles.title}>Profile</Text>

					<View style={styles.centerBox}>
						<View style={styles.avatar} />
						<Text style={styles.heading}>Sign in to Yardr</Text>
						<Text style={styles.sub}>
							Create and manage your sales, save favorites, and more.
						</Text>

						<TouchableOpacity
							style={styles.primaryBtn}
							onPress={() => setShowLogin(true)}
						>
							<Text style={styles.primaryText}>Sign In or Sign Up</Text>
						</TouchableOpacity>
					</View>
				</View>

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

	// ---------------------------
	// LOGGED IN VIEW
	// ---------------------------
	return (
		<>
			<ScrollView style={styles.container}>
				<Text style={styles.title}>Profile</Text>

				<View style={styles.card}>
					<View style={styles.avatarLarge} />
					<Text style={styles.name}>Demo User</Text>
					<Text style={styles.email}>{user.email}</Text>
				</View>

				<View style={styles.stats}>
					<Stat label="Sales" value="1" />
					<Stat label="Saved" value="0" />
					<Stat label="Visits" value="0" />
				</View>

				<MenuItem label="My Sales" onPress={() => router.push("/my-sales")} />
				<MenuItem
					label="Saved Sales"
					onPress={() => showComingSoon("Saved Sales")}
				/>
				<MenuItem
					label="Notifications"
					onPress={() => showComingSoon("Notifications")}
				/>
				<MenuItem label="Settings" onPress={() => showComingSoon("Settings")} />
				<MenuItem
					label="Help & Support"
					onPress={() => showComingSoon("Help & Support")}
				/>

				<TouchableOpacity style={styles.logout} onPress={signOut}>
					<Text style={styles.logoutText}>Sign Out</Text>
				</TouchableOpacity>
			</ScrollView>

			<ProfileMenuSheet visible={showMenu} onClose={() => setShowMenu(false)} />
		</>
	);
}

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<View style={styles.stat}>
			<Text style={styles.statValue}>{value}</Text>
			<Text style={styles.statLabel}>{label}</Text>
		</View>
	);
}

function MenuItem({ label, onPress }: { label: string; onPress: () => void }) {
	return (
		<TouchableOpacity style={styles.menuItem} onPress={onPress}>
			<Text style={styles.menuText}>{label}</Text>
			<Text style={styles.arrow}>›</Text>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#FAF7F2", padding: 20 },
	title: { fontSize: 28, fontWeight: "800", marginBottom: 20 },

	centerBox: { alignItems: "center", marginTop: 80 },
	avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#EEE" },
	heading: { fontSize: 22, fontWeight: "700", marginTop: 20 },
	sub: { textAlign: "center", color: "#777", marginTop: 10 },

	primaryBtn: {
		backgroundColor: "#D97B3F",
		paddingHorizontal: 28,
		paddingVertical: 16,
		borderRadius: 30,
		marginTop: 30,
	},
	primaryText: { color: "#fff", fontSize: 16, fontWeight: "700" },

	card: {
		backgroundColor: "#fff",
		borderRadius: 20,
		padding: 20,
		alignItems: "center",
		marginBottom: 20,
	},
	avatarLarge: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: "#F2E6DA",
	},
	name: { fontSize: 20, fontWeight: "700", marginTop: 10 },
	email: { color: "#777", marginTop: 4 },

	stats: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 20,
	},
	stat: {
		flex: 1,
		backgroundColor: "#fff",
		marginHorizontal: 4,
		borderRadius: 16,
		padding: 16,
		alignItems: "center",
	},
	statValue: { fontSize: 20, fontWeight: "800" },
	statLabel: { color: "#777", marginTop: 4 },

	menuItem: {
		backgroundColor: "#fff",
		padding: 18,
		borderRadius: 16,
		marginBottom: 10,
		flexDirection: "row",
		justifyContent: "space-between",
	},
	menuText: { fontSize: 16, fontWeight: "600" },
	arrow: { fontSize: 20, color: "#999" },

	logout: {
		marginTop: 20,
		padding: 16,
		borderRadius: 30,
		borderWidth: 1,
		borderColor: "#F3B0A5",
		alignItems: "center",
	},
	logoutText: { color: "#E0523A", fontWeight: "700" },
});
