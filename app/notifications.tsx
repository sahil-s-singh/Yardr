// app/notifications.tsx
import GradientBackground from "@/components/ui/GradientBackground";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
	NotificationHistoryEntry,
	notificationHistory,
} from "@/lib/notificationHistory";
import { MaterialIcons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
	Alert,
	FlatList,
	SafeAreaView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

function formatRelative(iso: string): string {
	const date = new Date(iso);
	const now = Date.now();
	const diffMs = now - date.getTime();
	const sec = Math.round(diffMs / 1000);
	if (sec < 60) return "just now";
	const min = Math.round(sec / 60);
	if (min < 60) return `${min}m ago`;
	const hr = Math.round(min / 60);
	if (hr < 24) return `${hr}h ago`;
	const day = Math.round(hr / 24);
	if (day < 7) return `${day}d ago`;
	return date.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
	});
}

export default function NotificationsScreen() {
	const colorScheme = useColorScheme();
	const theme = Colors[colorScheme ?? "light"];

	const [items, setItems] = useState<NotificationHistoryEntry[]>([]);
	const [loading, setLoading] = useState(true);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			try {
				const presented = await Notifications.getPresentedNotificationsAsync();
				const existing = await notificationHistory.list();
				const known = new Set(existing.map((n) => n.id));
				for (const n of presented) {
					if (known.has(n.request.identifier)) continue;
					await notificationHistory.append({
						id: n.request.identifier,
						title: n.request.content.title ?? "Notification",
						body: n.request.content.body ?? "",
						data:
							(n.request.content.data as Record<string, any>) ?? undefined,
					});
				}
			} catch (err) {
				console.error("Failed to backfill presented notifications:", err);
			}
			const list = await notificationHistory.list();
			setItems(list);
		} finally {
			setLoading(false);
		}
	}, []);

	useFocusEffect(
		useCallback(() => {
			load();
		}, [load]),
	);

	const handlePress = useCallback(
		async (item: NotificationHistoryEntry) => {
			if (!item.read) {
				await notificationHistory.markAsRead(item.id);
				setItems((prev) =>
					prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)),
				);
			}
			if (item.data?.garageSaleId) {
				router.push(`/sale-detail/${item.data.garageSaleId}`);
			}
		},
		[],
	);

	const handleMarkAllRead = useCallback(async () => {
		await notificationHistory.markAllRead();
		setItems((prev) => prev.map((n) => ({ ...n, read: true })));
	}, []);

	const handleClear = useCallback(() => {
		if (items.length === 0) return;
		Alert.alert(
			"Clear notifications",
			"Remove all notifications from your history?",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Clear",
					style: "destructive",
					onPress: async () => {
						await notificationHistory.clear();
						setItems([]);
					},
				},
			],
		);
	}, [items.length]);

	const unreadCount = items.filter((n) => !n.read).length;

	return (
		<SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
			<GradientBackground />

			<View style={styles.headerRow}>
				<TouchableOpacity onPress={() => router.back()} hitSlop={12}>
					<MaterialIcons name="chevron-left" size={28} color={theme.text} />
				</TouchableOpacity>
				<Text style={[styles.headerTitle, { color: theme.text }]}>
					Notifications
				</Text>
				<TouchableOpacity
					onPress={handleClear}
					hitSlop={12}
					disabled={items.length === 0}
				>
					<Text
						style={[
							styles.headerAction,
							{
								color:
									items.length === 0 ? theme.secondaryText : theme.tint,
							},
						]}
					>
						Clear
					</Text>
				</TouchableOpacity>
			</View>

			{unreadCount > 0 ? (
				<TouchableOpacity
					style={[styles.markAllRow, { borderColor: theme.border }]}
					onPress={handleMarkAllRead}
					activeOpacity={0.7}
				>
					<MaterialIcons name="done-all" size={16} color={theme.tint} />
					<Text style={[styles.markAllText, { color: theme.tint }]}>
						Mark all as read ({unreadCount})
					</Text>
				</TouchableOpacity>
			) : null}

			<FlatList
				data={items}
				keyExtractor={(item) => item.id}
				contentContainerStyle={styles.list}
				ListEmptyComponent={
					!loading ? (
						<View style={styles.empty}>
							<MaterialIcons
								name="notifications-none"
								size={48}
								color={theme.secondaryText}
							/>
							<Text style={[styles.emptyTitle, { color: theme.text }]}>
								No notifications yet
							</Text>
							<Text
								style={[styles.emptyHint, { color: theme.secondaryText }]}
							>
								Wishlist matches and sale reminders will show up here.
							</Text>
						</View>
					) : null
				}
				renderItem={({ item }) => (
					<TouchableOpacity
						style={[
							styles.item,
							{ backgroundColor: theme.card, borderColor: theme.border },
							!item.read && {
								backgroundColor: `${theme.tint}0D`,
								borderColor: `${theme.tint}40`,
							},
						]}
						onPress={() => handlePress(item)}
						activeOpacity={0.85}
					>
						<View
							style={[
								styles.iconCircle,
								{ backgroundColor: `${theme.tint}1A` },
							]}
						>
							<MaterialIcons
								name="notifications"
								size={20}
								color={theme.tint}
							/>
						</View>
						<View style={styles.itemBody}>
							<View style={styles.itemHeader}>
								<Text
									style={[
										styles.itemTitle,
										{ color: theme.text },
										!item.read && styles.itemTitleUnread,
									]}
									numberOfLines={1}
								>
									{item.title}
								</Text>
								{!item.read ? (
									<View
										style={[styles.dot, { backgroundColor: theme.tint }]}
									/>
								) : null}
							</View>
							{item.body ? (
								<Text
									style={[
										styles.itemBodyText,
										{ color: theme.secondaryText },
									]}
									numberOfLines={2}
								>
									{item.body}
								</Text>
							) : null}
							<Text
								style={[styles.itemTime, { color: theme.secondaryText }]}
							>
								{formatRelative(item.receivedAt)}
							</Text>
						</View>
					</TouchableOpacity>
				)}
			/>
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
	headerAction: {
		fontSize: 14,
		fontWeight: "700",
	},

	markAllRow: {
		marginHorizontal: 20,
		marginBottom: 8,
		paddingVertical: 10,
		paddingHorizontal: 12,
		borderRadius: 12,
		borderWidth: 1,
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	markAllText: {
		fontSize: 13,
		fontWeight: "700",
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
	itemHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	itemTitle: {
		flex: 1,
		fontSize: 15,
		fontWeight: "700",
	},
	itemTitleUnread: {
		fontWeight: "800",
	},
	dot: {
		width: 8,
		height: 8,
		borderRadius: 4,
	},
	itemBodyText: {
		marginTop: 3,
		fontSize: 13,
		lineHeight: 18,
	},
	itemTime: {
		marginTop: 6,
		fontSize: 11,
		fontWeight: "600",
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
