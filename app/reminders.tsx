// app/reminders.tsx
import GradientBackground from "@/components/ui/GradientBackground";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { remindersService } from "@/services/remindersService";
import { MaterialIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	FlatList,
	SafeAreaView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

type ReminderRow = {
	id: string;
	garageSaleId: string;
	reminderTime: string;
	saleTitle: string;
	saleDate: string | null;
};

function formatReminderTime(iso: string): string {
	return new Date(iso).toLocaleString(undefined, {
		weekday: "short",
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
}

export default function RemindersScreen() {
	const colorScheme = useColorScheme();
	const theme = Colors[colorScheme ?? "light"];
	const { user } = useAuth();

	const [reminders, setReminders] = useState<ReminderRow[]>([]);
	const [loading, setLoading] = useState(true);

	const load = useCallback(async () => {
		if (!user) {
			setReminders([]);
			setLoading(false);
			return;
		}
		setLoading(true);
		try {
			const rows = await remindersService.getUserRemindersWithDetails(user.id);
			setReminders(
				rows
					.filter((r: any) => r.garageSale)
					.map((r: any) => ({
						id: r.reminder.id,
						garageSaleId: r.reminder.garage_sale_id,
						reminderTime: r.reminder.reminder_time,
						saleTitle: r.garageSale.title,
						saleDate: r.garageSale.startDate || r.garageSale.date || null,
					})),
			);
		} catch (err) {
			console.error("Error loading reminders:", err);
		} finally {
			setLoading(false);
		}
	}, [user]);

	useFocusEffect(
		useCallback(() => {
			load();
		}, [load]),
	);

	const handleRemove = useCallback(
		(reminder: ReminderRow) => {
			if (!user) return;
			Alert.alert("Remove reminder?", reminder.saleTitle, [
				{ text: "Cancel", style: "cancel" },
				{
					text: "Remove",
					style: "destructive",
					onPress: async () => {
						try {
							await remindersService.removeReminder(
								user.id,
								reminder.garageSaleId,
							);
							setReminders((prev) =>
								prev.filter((r) => r.id !== reminder.id),
							);
						} catch (err) {
							console.error("Error removing reminder:", err);
							Alert.alert("Error", "Failed to remove reminder");
						}
					},
				},
			]);
		},
		[user],
	);

	return (
		<SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
			<GradientBackground />

			<View style={styles.headerRow}>
				<TouchableOpacity onPress={() => router.back()} hitSlop={12}>
					<MaterialIcons name="chevron-left" size={28} color={theme.text} />
				</TouchableOpacity>
				<Text style={[styles.headerTitle, { color: theme.text }]}>
					Reminders
				</Text>
				<View style={{ width: 28 }} />
			</View>

			{loading ? (
				<View style={styles.center}>
					<ActivityIndicator color={theme.tint} />
				</View>
			) : (
				<FlatList
					data={reminders}
					keyExtractor={(item) => item.id}
					contentContainerStyle={styles.list}
					ListEmptyComponent={
						<View style={styles.empty}>
							<MaterialIcons
								name="notifications-none"
								size={48}
								color={theme.secondaryText}
							/>
							<Text style={[styles.emptyTitle, { color: theme.text }]}>
								No reminders set
							</Text>
							<Text
								style={[styles.emptyHint, { color: theme.secondaryText }]}
							>
								Tap "Remind Me" on any sale to set one.
							</Text>
						</View>
					}
					renderItem={({ item }) => (
						<TouchableOpacity
							style={[
								styles.item,
								{ backgroundColor: theme.card, borderColor: theme.border },
							]}
							onPress={() => router.push(`/sale-detail/${item.garageSaleId}`)}
							activeOpacity={0.85}
						>
							<View
								style={[
									styles.iconCircle,
									{ backgroundColor: `${theme.tint}1A` },
								]}
							>
								<MaterialIcons
									name="notifications-active"
									size={20}
									color={theme.tint}
								/>
							</View>
							<View style={styles.itemBody}>
								<Text
									style={[styles.itemTitle, { color: theme.text }]}
									numberOfLines={1}
								>
									{item.saleTitle}
								</Text>
								<Text
									style={[
										styles.itemSub,
										{ color: theme.secondaryText },
									]}
									numberOfLines={1}
								>
									Reminds {formatReminderTime(item.reminderTime)}
								</Text>
							</View>
							<TouchableOpacity
								onPress={() => handleRemove(item)}
								hitSlop={12}
								style={styles.removeBtn}
							>
								<MaterialIcons
									name="close"
									size={20}
									color={theme.secondaryText}
								/>
							</TouchableOpacity>
						</TouchableOpacity>
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
		paddingHorizontal: 20,
		paddingTop: 4,
		paddingBottom: 120,
		flexGrow: 1,
	},
	item: {
		flexDirection: "row",
		gap: 12,
		padding: 14,
		borderRadius: 16,
		borderWidth: 1,
		marginBottom: 10,
		alignItems: "center",
	},
	iconCircle: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
	},
	itemBody: {
		flex: 1,
	},
	itemTitle: {
		fontSize: 15,
		fontWeight: "700",
	},
	itemSub: {
		marginTop: 3,
		fontSize: 13,
	},
	removeBtn: {
		padding: 4,
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
