import React, { useEffect, useMemo } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import FavoriteButton from "@/components/FavoriteButton";
import ReminderButton from "@/components/ReminderButton";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { GarageSale } from "@/types/garageSale";
import { useVideoPlayer, VideoView } from "expo-video";

function formatDateBadge(iso: string) {
	const d = new Date(iso + "T00:00:00");
	const month = d.toLocaleDateString("en-US", { month: "short" });
	const day = d.getDate();
	return `${month} ${day}`;
}

function formatTimeRange(startTime?: string, endTime?: string) {
	if (!startTime || !endTime) return "";
	const to12 = (t: string) => {
		const [hh, mm] = t.split(":").map(Number);
		const ampm = hh >= 12 ? "PM" : "AM";
		const h = ((hh + 11) % 12) + 1;
		return `${h}${mm ? `:${String(mm).padStart(2, "0")}` : ""}${ampm}`;
	};
	return `${to12(startTime)} \u2013 ${to12(endTime)}`;
}

export default function SaleCard({
	sale,
	distanceText,
	onPress,
}: {
	sale: GarageSale;
	distanceText?: string;
	onPress?: () => void;
}) {
	const colorScheme = useColorScheme();
	const theme = Colors[colorScheme ?? "light"];

	const img = sale.images?.[0];
	const videoUrl = sale.videoUrl;
	const dateIso = sale.startDate || sale.date;

	const player = useVideoPlayer(videoUrl ?? null, (p) => {
		p.loop = true;
		p.volume = 0;
	});

	useEffect(() => {
		if (videoUrl) {
			player.play();
		}
	}, [videoUrl]);

	const badgeText = useMemo(() => formatDateBadge(dateIso), [dateIso]);
	const timeText = useMemo(
		() => formatTimeRange(sale.startTime, sale.endTime),
		[sale.startTime, sale.endTime]
	);

	const content = (
		<>
			<View style={styles.mediaWrap}>
				{videoUrl ? (
					<VideoView
						player={player}
						style={styles.media}
						contentFit="cover"
						nativeControls={false}
					/>
				) : img ? (
					<Image
						source={{ uri: img }}
						style={styles.media}
						resizeMode="cover"
					/>
				) : (
					<View
						style={[styles.mediaPlaceholder, { backgroundColor: theme.muted }]}
					>
						<MaterialIcons name="photo" size={28} color={theme.secondaryText} />
					</View>
				)}

				{distanceText ? (
					<View style={styles.distancePill}>
						<Text style={styles.distanceText}>{distanceText}</Text>
					</View>
				) : null}

				<View style={styles.actionsBackdrop}>
					<FavoriteButton
						garageSaleId={sale.id}
						variant="floating"
						size={22}
					/>
					<ReminderButton
						garageSaleId={sale.id}
						garageSaleTitle={sale.title}
						garageSaleDate={dateIso}
						variant="floating"
						size={20}
					/>
				</View>

				<View style={[styles.dateBadge, { backgroundColor: theme.tint }]}>
					<Text style={styles.dateText}>{badgeText}</Text>
				</View>
			</View>

			<View style={styles.body}>
				<Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
					{sale.title}
				</Text>

				<Text style={[styles.timeText, { color: theme.secondaryText }]}>
					{timeText}
				</Text>
			</View>
		</>
	);

	if (onPress) {
		return (
			<TouchableOpacity
				style={[styles.card, { backgroundColor: theme.card }]}
				onPress={onPress}
				activeOpacity={0.95}
			>
				{content}
			</TouchableOpacity>
		);
	}

	return (
		<View style={[styles.card, { backgroundColor: theme.card }]}>
			{content}
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		borderRadius: 22,
		overflow: "hidden",
		marginBottom: 16,
		shadowColor: "#000",
		shadowOpacity: 0.06,
		shadowRadius: 20,
		shadowOffset: { width: 0, height: 4 },
		elevation: 3,
	},
	mediaWrap: { height: 180, width: "100%" },
	media: { width: "100%", height: "100%" },
	mediaPlaceholder: {
		width: "100%",
		height: "100%",
		alignItems: "center",
		justifyContent: "center",
	},

	distancePill: {
		position: "absolute",
		top: 12,
		right: 12,
		backgroundColor: "rgba(255,255,255,0.85)",
		borderRadius: 999,
		paddingVertical: 5,
		paddingHorizontal: 10,
	},
	distanceText: { fontSize: 12, fontWeight: "700", color: "#23201C" },

	actionsBackdrop: {
		position: "absolute",
		top: 8,
		left: 8,
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "rgba(255,255,255,0.9)",
		borderRadius: 22,
		paddingHorizontal: 2,
	},

	dateBadge: {
		position: "absolute",
		left: 12,
		bottom: 12,
		borderRadius: 10,
		paddingVertical: 5,
		paddingHorizontal: 10,
	},
	dateText: { color: "#fff", fontSize: 12, fontWeight: "700" },

	body: { padding: 16 },
	title: {
		fontSize: 18,
		fontWeight: "700",
		letterSpacing: -0.2,
		marginBottom: 6,
	},

	timeText: { fontSize: 14, fontWeight: "600" },
});
