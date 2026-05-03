// app/favorites.tsx
import GradientBackground from "@/components/ui/GradientBackground";
import SaleCard from "@/components/ui/SaleCard";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { favoritesService } from "@/services/favoritesService";
import { GarageSale } from "@/types/garageSale";
import { MaterialIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	SafeAreaView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

export default function FavoritesScreen() {
	const colorScheme = useColorScheme();
	const theme = Colors[colorScheme ?? "light"];
	const { user } = useAuth();

	const [favorites, setFavorites] = useState<GarageSale[]>([]);
	const [loading, setLoading] = useState(true);

	const load = useCallback(async () => {
		if (!user) {
			setFavorites([]);
			setLoading(false);
			return;
		}
		setLoading(true);
		try {
			const sales = await favoritesService.getUserFavorites(user.id);
			setFavorites(sales);
		} catch (err) {
			console.error("Error loading favorites:", err);
		} finally {
			setLoading(false);
		}
	}, [user]);

	useFocusEffect(
		useCallback(() => {
			load();
		}, [load]),
	);

	return (
		<SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
			<GradientBackground />

			<View style={styles.headerRow}>
				<TouchableOpacity onPress={() => router.back()} hitSlop={12}>
					<MaterialIcons name="chevron-left" size={28} color={theme.text} />
				</TouchableOpacity>
				<Text style={[styles.headerTitle, { color: theme.text }]}>
					Saved
				</Text>
				<View style={{ width: 28 }} />
			</View>

			{loading ? (
				<View style={styles.center}>
					<ActivityIndicator color={theme.tint} />
				</View>
			) : (
				<FlatList
					data={favorites}
					keyExtractor={(item) => item.id}
					contentContainerStyle={styles.list}
					ListEmptyComponent={
						<View style={styles.empty}>
							<MaterialIcons
								name="favorite-border"
								size={48}
								color={theme.secondaryText}
							/>
							<Text style={[styles.emptyTitle, { color: theme.text }]}>
								No saved sales
							</Text>
							<Text
								style={[styles.emptyHint, { color: theme.secondaryText }]}
							>
								Tap the heart on any sale to save it here.
							</Text>
						</View>
					}
					renderItem={({ item }) => (
						<View style={styles.cardWrap}>
							<SaleCard
								sale={item}
								onPress={() => router.push(`/sale-detail/${item.id}`)}
							/>
						</View>
					)}
				/>
			)}
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1 },
	headerRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingTop: 4,
		paddingBottom: 8,
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: "800",
	},
	center: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	list: {
		paddingHorizontal: 16,
		paddingTop: 4,
		paddingBottom: 120,
		flexGrow: 1,
	},
	cardWrap: {
		marginBottom: 12,
	},
	empty: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 32,
		paddingTop: 80,
	},
	emptyTitle: {
		fontSize: 17,
		fontWeight: "800",
		marginTop: 12,
	},
	emptyHint: {
		marginTop: 6,
		fontSize: 13,
		textAlign: "center",
		lineHeight: 19,
	},
});
