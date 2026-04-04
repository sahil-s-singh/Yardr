// app/my-sales.tsx
import GradientBackground from "@/components/ui/GradientBackground";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { deleteSale, getMySales } from "@/services/garageSaleService";
import { MaterialIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
	Alert,
	Image,
	SafeAreaView,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

export default function MySalesScreen() {
	const { user } = useAuth();
	const colorScheme = useColorScheme();
	const theme = Colors[colorScheme ?? "light"];
	const [sales, setSales] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	// Redirect if not logged in (in useEffect to avoid hooks violation)
	useEffect(() => {
		if (!user) {
			router.replace("/(tabs)/profile");
		}
	}, [user]);

	useFocusEffect(
		useCallback(() => {
			if (!user) return;
			const load = async () => {
				setLoading(true);
				const data = await getMySales(user.id);
				setSales(data || []);
				setLoading(false);
			};
			load();
		}, [user])
	);

	const confirmDelete = (id: string) => {
		Alert.alert("Delete Sale", "This action cannot be undone.", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Delete",
				style: "destructive",
				onPress: async () => {
					await deleteSale(id);
					setSales((prev) => prev.filter((s) => s.id !== id));
				},
			},
		]);
	};

	if (!user) return null;

	return (
		<SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
			<GradientBackground />

			{/* HEADER */}
			<View style={styles.header}>
				<TouchableOpacity onPress={() => router.back()}>
					<MaterialIcons name="chevron-left" size={28} color={theme.text} />
				</TouchableOpacity>
				<Text style={[styles.headerTitle, { color: theme.text }]}>
					My Sales
				</Text>
				<View style={{ width: 28 }} />
			</View>

			<ScrollView
				style={styles.container}
				contentContainerStyle={{ paddingBottom: 40 }}
			>
				{/* EMPTY STATE */}
				{!loading && sales.length === 0 && (
					<View style={styles.empty}>
						<MaterialIcons
							name="storefront"
							size={48}
							color={theme.secondaryText}
						/>
						<Text style={[styles.emptyTitle, { color: theme.text }]}>
							No sales yet
						</Text>
						<Text style={[styles.emptySub, { color: theme.secondaryText }]}>
							Create a sale to start reaching buyers nearby.
						</Text>
					</View>
				)}

				{sales.map((sale) => {
					const imageUri =
						sale.images?.[0] || sale.video_url || null;

					return (
						<View
							key={sale.id}
							style={[styles.card, { backgroundColor: theme.card }]}
						>
							{imageUri ? (
								<Image
									source={{ uri: imageUri }}
									style={styles.image}
								/>
							) : (
								<View
									style={[styles.imagePlaceholder, { backgroundColor: theme.muted }]}
								>
									<MaterialIcons
										name="photo"
										size={32}
										color={theme.secondaryText}
									/>
								</View>
							)}

							<View style={styles.info}>
								<Text style={[styles.name, { color: theme.text }]}>
									{sale.title}
								</Text>
								<Text style={[styles.meta, { color: theme.secondaryText }]}>
									{sale.start_date
										? new Date(sale.start_date + "T00:00:00").toDateString()
										: "No date"}
								</Text>
							</View>

							<View style={styles.actions}>
								<ActionBtn
									label="View"
									theme={theme}
									onPress={() => router.push(`/sale-detail/${sale.id}`)}
								/>
								<ActionBtn
									label="Edit"
									theme={theme}
									onPress={() => router.push(`/edit-sale/${sale.id}`)}
								/>
								<ActionBtn
									label="Delete"
									theme={theme}
									danger
									onPress={() => confirmDelete(sale.id)}
								/>
							</View>
						</View>
					);
				})}
			</ScrollView>
		</SafeAreaView>
	);
}

function ActionBtn({
	label,
	onPress,
	danger,
	theme,
}: {
	label: string;
	onPress: () => void;
	danger?: boolean;
	theme: any;
}) {
	return (
		<TouchableOpacity
			style={[
				styles.btn,
				{ borderColor: danger ? "#E05244" : theme.border },
			]}
			onPress={onPress}
		>
			<Text
				style={[
					styles.btnText,
					{ color: danger ? "#E05244" : theme.text },
				]}
			>
				{label}
			</Text>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1 },

	header: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingBottom: 10,
	},
	headerTitle: {
		flex: 1,
		textAlign: "center",
		fontSize: 20,
		fontWeight: "800",
	},

	container: { padding: 20 },

	empty: {
		marginTop: 80,
		alignItems: "center",
	},
	emptyTitle: { fontSize: 20, fontWeight: "700", marginTop: 12 },
	emptySub: { marginTop: 6, textAlign: "center", lineHeight: 20 },

	card: {
		borderRadius: 22,
		padding: 14,
		marginBottom: 16,
		shadowColor: "#000",
		shadowOpacity: 0.04,
		shadowRadius: 16,
		shadowOffset: { width: 0, height: 4 },
		elevation: 2,
	},
	image: {
		width: "100%",
		height: 180,
		borderRadius: 16,
	},
	imagePlaceholder: {
		width: "100%",
		height: 180,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
	},
	info: { marginTop: 10 },
	name: { fontSize: 18, fontWeight: "700" },
	meta: { marginTop: 2, fontSize: 14 },

	actions: {
		flexDirection: "row",
		marginTop: 14,
		gap: 8,
	},
	btn: {
		flex: 1,
		paddingVertical: 12,
		borderRadius: 14,
		borderWidth: 1,
		alignItems: "center",
	},
	btnText: { fontWeight: "700", fontSize: 14 },
});
