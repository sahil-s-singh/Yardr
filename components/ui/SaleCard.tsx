import React, { useMemo } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { GarageSale } from "@/types/garageSale";

function formatDateBadge(iso: string) {
	const d = new Date(iso);
	const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
	const month = d.toLocaleDateString("en-US", { month: "short" });
	const day = d.getDate();
	return `${weekday}, ${month} ${day}`;
}

function formatTimeRange(startTime?: string, endTime?: string) {
	if (!startTime || !endTime) return "";
	const to12 = (t: string) => {
		const [hh, mm] = t.split(":").map(Number);
		const ampm = hh >= 12 ? "PM" : "AM";
		const h = ((hh + 11) % 12) + 1;
		return `${h}${mm ? `:${String(mm).padStart(2, "0")}` : ""}${ampm}`;
	};
	return `${to12(startTime)} - ${to12(endTime)}`;
}

export default function SaleCard({
	sale,
	distanceText,
}: {
	sale: GarageSale;
	distanceText?: string;
}) {
	const colorScheme = useColorScheme();
	const theme = Colors[colorScheme ?? "light"];

	const img = sale.images?.[0];
	const dateIso = sale.startDate || sale.date;

	const badgeText = useMemo(() => formatDateBadge(dateIso), [dateIso]);
	const timeText = useMemo(
		() => formatTimeRange(sale.startTime, sale.endTime),
		[sale.startTime, sale.endTime]
	);

	return (
		<View
			style={[
				styles.card,
				{ backgroundColor: theme.card, borderColor: theme.border },
			]}
		>
			<View style={styles.mediaWrap}>
				{img ? (
					<Image
						source={{ uri: img }}
						style={styles.media}
						resizeMode="cover"
					/>
				) : (
					<View
						style={[styles.mediaPlaceholder, { backgroundColor: theme.muted }]}
					>
						<IconSymbol size={30} name="photo" color={theme.secondaryText} />
					</View>
				)}

				<View
					style={[
						styles.distancePill,
						{ backgroundColor: theme.card, borderColor: theme.border },
					]}
				>
					<IconSymbol
						size={16}
						name="location.fill"
						color={theme.secondaryText}
					/>
					<Text style={[styles.distanceText, { color: theme.text }]}>
						{distanceText || ""}
					</Text>
				</View>

				<View style={[styles.dateBadge, { backgroundColor: theme.tint }]}>
					<IconSymbol size={16} name="calendar" color="#FFFFFF" />
					<Text style={styles.dateText}>{badgeText}</Text>
				</View>
			</View>

			<View style={styles.body}>
				<Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
					{sale.title}
				</Text>

				<View style={styles.timeRow}>
					<IconSymbol size={16} name="clock" color={theme.secondaryText} />
					<Text style={[styles.timeText, { color: theme.secondaryText }]}>
						{timeText}
					</Text>
				</View>

				<View style={[styles.divider, { backgroundColor: theme.border }]} />

				<View style={styles.itemsRow}>
					<View style={styles.avatarStack}>
						<View style={[styles.avatar, { backgroundColor: theme.muted }]} />
						<View
							style={[
								styles.avatar,
								{ backgroundColor: theme.muted, marginLeft: -10 },
							]}
						/>
						<View
							style={[
								styles.avatar,
								{ backgroundColor: theme.muted, marginLeft: -10 },
							]}
						/>
					</View>
					<Text style={[styles.itemsText, { color: theme.secondaryText }]}>
						{(sale.categories?.length ?? 0) || 4} items
					</Text>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		borderWidth: 1,
		borderRadius: 18,
		overflow: "hidden",
		marginBottom: 16,
		shadowColor: "#000",
		shadowOpacity: 0.08,
		shadowRadius: 18,
		shadowOffset: { width: 0, height: 8 },
		elevation: 3,
	},
	mediaWrap: { height: 230, width: "100%" },
	media: { width: "100%", height: "100%" },
	mediaPlaceholder: {
		width: "100%",
		height: "100%",
		alignItems: "center",
		justifyContent: "center",
	},

	distancePill: {
		position: "absolute",
		top: 14,
		right: 14,
		borderWidth: 1,
		borderRadius: 999,
		paddingVertical: 8,
		paddingHorizontal: 12,
		flexDirection: "row",
		gap: 8,
		alignItems: "center",
	},
	distanceText: { fontSize: 15, fontWeight: "800" },

	dateBadge: {
		position: "absolute",
		left: 14,
		bottom: 14,
		borderRadius: 999,
		paddingVertical: 10,
		paddingHorizontal: 14,
		flexDirection: "row",
		gap: 10,
		alignItems: "center",
	},
	dateText: { color: "#fff", fontSize: 16, fontWeight: "800" },

	body: { padding: 16 },
	title: {
		fontSize: 22,
		fontWeight: "900",
		letterSpacing: -0.3,
		marginBottom: 10,
	},

	timeRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		marginBottom: 10,
	},
	timeText: { fontSize: 16, fontWeight: "700" },

	divider: { height: 1, width: "100%", marginVertical: 12 },

	itemsRow: { flexDirection: "row", alignItems: "center", gap: 12 },
	avatarStack: { flexDirection: "row", alignItems: "center" },
	avatar: {
		width: 26,
		height: 26,
		borderRadius: 999,
		borderWidth: 2,
		borderColor: "#fff",
	},
	itemsText: { fontSize: 16, fontWeight: "700" },
});
