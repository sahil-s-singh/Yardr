// app/wishlists.tsx
import GradientBackground from "@/components/ui/GradientBackground";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { wishlistService } from "@/services/wishlistService";
import { UserWishlistItem } from "@/types/user";
import { MaterialIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	KeyboardAvoidingView,
	Platform,
	SafeAreaView,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

const theme = Colors.light;

export default function WishlistsScreen() {
	const { user, isAuthenticated } = useAuth();
	const [items, setItems] = useState<UserWishlistItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [input, setInput] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const loadItems = useCallback(async () => {
		if (!user) {
			setLoading(false);
			return;
		}
		try {
			const data = await wishlistService.getUserWishlistItems(user.id);
			setItems(data);
		} catch (error) {
			console.error("Error loading wishlist items:", error);
		} finally {
			setLoading(false);
		}
	}, [user]);

	useFocusEffect(
		useCallback(() => {
			if (isAuthenticated && user) loadItems();
			else setLoading(false);
		}, [isAuthenticated, user, loadItems]),
	);

	const handleAdd = async () => {
		const name = input.trim();
		if (!name || !user) return;
		setSubmitting(true);
		try {
			const created = await wishlistService.addWishlistItem(user.id, name);
			setItems((prev) => [created, ...prev]);
			setInput("");
		} catch (error: any) {
			console.error("Add wishlist error:", error);
			Alert.alert("Error", error.message || "Failed to add item");
		} finally {
			setSubmitting(false);
		}
	};

	const handleRemove = async (item: UserWishlistItem) => {
		setItems((prev) => prev.filter((i) => i.id !== item.id));
		try {
			await wishlistService.deleteWishlistItem(item.id);
		} catch (error) {
			console.error("Delete wishlist error:", error);
			loadItems();
		}
	};

	if (!isAuthenticated) {
		return (
			<SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
				<GradientBackground />
				<BackRow />
				<View style={styles.authPrompt}>
					<View style={styles.heartWell}>
						<MaterialIcons name="local-offer" size={56} color={theme.tint} />
					</View>
					<Text style={styles.authTitle}>Sign in to build your wishlist</Text>
					<Text style={styles.authText}>
						Save items you're hunting for and we'll ping you when they show up
						at a garage sale nearby.
					</Text>
					<TouchableOpacity
						style={styles.primaryBtn}
						onPress={() => router.push("/auth/sign-in")}
					>
						<Text style={styles.primaryBtnText}>Sign In</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
			<GradientBackground />
			<BackRow />

			<KeyboardAvoidingView
				style={styles.flex}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				<ScrollView
					style={styles.flex}
					contentContainerStyle={styles.content}
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
				>
					<View style={styles.titleBlock}>
						<Text style={styles.title}>My Wishlist</Text>
						<Text style={styles.subtitle}>
							{items.length === 0
								? "Add things you're hunting for"
								: `${items.length} tag${items.length === 1 ? "" : "s"} you're hunting for`}
						</Text>
					</View>

					{/* Quick add input */}
					<View style={styles.inputRow}>
						<TextInput
							style={styles.input}
							value={input}
							onChangeText={setInput}
							placeholder="e.g. record player, cast iron skillet"
							placeholderTextColor={theme.secondaryText}
							returnKeyType="done"
							onSubmitEditing={handleAdd}
							editable={!submitting}
						/>
						<TouchableOpacity
							style={[
								styles.addBtn,
								(!input.trim() || submitting) && styles.addBtnDisabled,
							]}
							onPress={handleAdd}
							disabled={!input.trim() || submitting}
							activeOpacity={0.85}
						>
							<MaterialIcons name="add" size={22} color="#fff" />
						</TouchableOpacity>
					</View>

					{/* Tag list */}
					<View style={styles.tagSection}>
						<Text style={styles.sectionLabel}>Your tags</Text>

						{loading ? (
							<ActivityIndicator color={theme.tint} style={{ marginTop: 20 }} />
						) : items.length === 0 ? (
							<View style={styles.emptyBlock}>
								<MaterialIcons
									name="local-offer"
									size={28}
									color={theme.secondaryText}
								/>
								<Text style={styles.emptyText}>
									No tags yet — add one above
								</Text>
							</View>
						) : (
							<View style={styles.tagWrap}>
								{items.map((item) => (
									<View key={item.id} style={styles.tag}>
										<Text style={styles.tagText}>{item.item_name}</Text>
										<TouchableOpacity
											onPress={() => handleRemove(item)}
											hitSlop={10}
											style={styles.tagClose}
										>
											<MaterialIcons name="close" size={14} color={theme.tint} />
										</TouchableOpacity>
									</View>
								))}
							</View>
						)}
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

function BackRow() {
	return (
		<View style={styles.backRow}>
			<TouchableOpacity onPress={() => router.back()} hitSlop={12}>
				<MaterialIcons name="chevron-left" size={28} color={theme.text} />
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1 },
	flex: { flex: 1 },

	backRow: {
		paddingHorizontal: 16,
		paddingTop: 4,
		paddingBottom: 2,
	},

	content: {
		paddingHorizontal: 18,
		paddingTop: 2,
		paddingBottom: 60,
	},

	titleBlock: { marginBottom: 20 },
	title: {
		fontSize: 28,
		fontWeight: "900",
		letterSpacing: -0.4,
		color: theme.text,
	},
	subtitle: {
		marginTop: 4,
		fontSize: 14,
		fontWeight: "600",
		color: theme.secondaryText,
	},

	inputRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		marginBottom: 22,
	},
	input: {
		flex: 1,
		height: 52,
		borderRadius: 16,
		backgroundColor: theme.card,
		paddingHorizontal: 16,
		fontSize: 15,
		fontWeight: "600",
		color: theme.text,
		borderWidth: 1,
		borderColor: theme.border,
	},
	addBtn: {
		width: 52,
		height: 52,
		borderRadius: 16,
		backgroundColor: theme.tint,
		alignItems: "center",
		justifyContent: "center",
		shadowColor: theme.tint,
		shadowOpacity: 0.3,
		shadowRadius: 10,
		shadowOffset: { width: 0, height: 6 },
		elevation: 4,
	},
	addBtnDisabled: {
		opacity: 0.4,
	},

	tagSection: {},
	sectionLabel: {
		fontSize: 12,
		fontWeight: "800",
		color: theme.secondaryText,
		letterSpacing: 0.6,
		textTransform: "uppercase",
		marginBottom: 12,
	},

	tagWrap: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 10,
	},
	tag: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		backgroundColor: "rgba(223,107,79,0.12)",
		borderWidth: 1,
		borderColor: "rgba(223,107,79,0.35)",
		borderRadius: 999,
		paddingLeft: 14,
		paddingRight: 10,
		paddingVertical: 8,
	},
	tagText: {
		fontSize: 14,
		fontWeight: "700",
		color: theme.tint,
	},
	tagClose: {
		width: 20,
		height: 20,
		borderRadius: 10,
		backgroundColor: "rgba(223,107,79,0.18)",
		alignItems: "center",
		justifyContent: "center",
	},

	emptyBlock: {
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 30,
		gap: 8,
	},
	emptyText: {
		fontSize: 14,
		fontWeight: "600",
		color: theme.secondaryText,
	},

	authPrompt: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 32,
	},
	authTitle: {
		fontSize: 22,
		fontWeight: "800",
		color: theme.text,
		marginBottom: 8,
		textAlign: "center",
	},
	authText: {
		fontSize: 14,
		color: theme.secondaryText,
		textAlign: "center",
		lineHeight: 20,
		marginBottom: 24,
	},
	heartWell: {
		width: 108,
		height: 108,
		borderRadius: 54,
		backgroundColor: "rgba(223,107,79,0.10)",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 20,
	},
	primaryBtn: {
		backgroundColor: theme.tint,
		paddingHorizontal: 28,
		paddingVertical: 14,
		borderRadius: 16,
	},
	primaryBtnText: {
		color: "#fff",
		fontWeight: "800",
		fontSize: 15,
	},
});
