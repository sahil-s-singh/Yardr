// app/sell/publish.tsx — Step 3: Review & Publish
import GradientBackground from "@/components/ui/GradientBackground";
import ProgressBar from "@/components/ui/ProgressBar";
import { useAuth } from "@/contexts/AuthContext";
import {
	clearSellDraft,
	loadSellDraft,
	SellDraft,
} from "@/lib/draftSale";
import { garageSaleService } from "@/services/garageSaleService";
import { videoService } from "@/services/videoService";
import { checkNewSaleAgainstWishlists } from "@/services/wishlistService";
import { LinearGradient } from "expo-linear-gradient";
import { useVideoPlayer, VideoView } from "expo-video";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
	Alert,
	SafeAreaView,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

function yyyyMmDd(d: Date) {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

function hhmm24(d: Date) {
	const h = String(d.getHours()).padStart(2, "0");
	const m = String(d.getMinutes()).padStart(2, "0");
	return `${h}:${m}`;
}

function getNextSaturday(): Date {
	const today = new Date();
	const dayOfWeek = today.getDay();
	const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
	const nextSaturday = new Date(today);
	nextSaturday.setDate(today.getDate() + daysUntilSaturday);
	return nextSaturday;
}

function prettyDate(dateStr: string) {
	const d = new Date(dateStr + "T00:00:00");
	return d.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function prettyTime(hhmmStr: string) {
	const [hStr, mStr] = hhmmStr.split(":");
	const h = parseInt(hStr, 10);
	const m = parseInt(mStr, 10);
	const period = h >= 12 ? "PM" : "AM";
	const h12 = h % 12 || 12;
	return m === 0 ? `${h12} ${period}` : `${h12}:${mStr} ${period}`;
}

function SummaryCard({
	label,
	value,
}: {
	label: string;
	value: string;
}) {
	return (
		<View style={styles.summaryCard}>
			<Text style={styles.summaryLabel}>{label}</Text>
			<Text style={styles.summaryValue} numberOfLines={2}>
				{value}
			</Text>
		</View>
	);
}

export default function PublishSaleScreen() {
	const { user } = useAuth();

	const [draft, setDraft] = useState<SellDraft | null>(null);
	const [loading, setLoading] = useState(true);
	const [publishing, setPublishing] = useState(false);

	useEffect(() => {
		let mounted = true;
		(async () => {
			const d = await loadSellDraft();
			if (!mounted || !d) return;
			setDraft(d);
			setLoading(false);
		})();
		return () => {
			mounted = false;
		};
	}, [user]);

	const startDate = useMemo(() => {
		return draft?.startDate || yyyyMmDd(getNextSaturday());
	}, [draft?.startDate]);

	const endDate = draft?.endDate || startDate;
	const startTime = draft?.startTime || "10:00";
	const endTime = draft?.endTime || "14:00";

	const handlePublish = async () => {
		if (!draft) return;

		setPublishing(true);

		try {
			const deviceId = `device-${Date.now()}-${Math.random()
				.toString(36)
				.substr(2, 9)}`;

			// Upload video to Supabase Storage if we have one
			let videoUrl: string | undefined;
			if (draft.videoUri) {
				try {
					videoUrl = await videoService.uploadVideo(draft.videoUri);
				} catch (uploadErr) {
					console.error("Video upload failed:", uploadErr);
					// Continue without video rather than blocking the publish
				}
			}

			const newSale = await garageSaleService.addGarageSale(
				{
					title: draft.title!,
					description: draft.description!,
					categories: draft.categories || [],
					location: {
						latitude: draft.coords?.latitude || 52.1332,
						longitude: draft.coords?.longitude || -106.67,
						address: draft.addressLine || "Sale location",
					},
					date: startDate,
					startDate: startDate,
					endDate: endDate,
					startTime,
					endTime,
					contactName: user?.user_metadata?.display_name || "Seller",
					contactPhone: undefined,
					contactEmail: user?.email || undefined,
					videoUrl,
					images: draft.photos || undefined,
					isActive: true,
				},
				deviceId,
				user?.id
			);

			// Check new sale against all active wishlists (non-blocking)
			checkNewSaleAgainstWishlists(newSale.id).catch((err) =>
				console.error("Wishlist matching failed:", err)
			);

			await clearSellDraft();
			router.replace("/sell/success");
		} catch (e: any) {
			console.error("Publish error:", e);
			Alert.alert(
				"Publish Failed",
				e.message || "Something went wrong. Please try again."
			);
		} finally {
			setPublishing(false);
		}
	};

	const goBack = () => {
		if (router.canGoBack()) router.back();
		else router.replace("/(tabs)");
	};

	const player = useVideoPlayer(draft?.videoUri ?? null, (p) => {
		p.loop = true;
	});

	const canPublish = !!draft?.title?.trim() && !!draft?.description?.trim();

	if (loading || !draft) return null;

	return (
		<SafeAreaView style={styles.safe}>
			<GradientBackground />

			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity onPress={goBack}>
					<Text style={styles.backChevron}>{"\u2039"}</Text>
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Review & Publish</Text>
				<View style={{ width: 20 }} />
			</View>

			<ProgressBar step={3} />

			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				{/* Video Preview */}
				{draft.videoUri && (
					<View style={styles.videoBox}>
						<VideoView
							player={player}
							style={StyleSheet.absoluteFill}
							nativeControls
							contentFit="cover"
						/>
					</View>
				)}

				{/* Summary Cards */}
				<SummaryCard label="Title" value={draft.title || "Untitled"} />
				<SummaryCard
					label="Date"
					value={
						endDate && endDate !== startDate
							? `${prettyDate(startDate)} – ${prettyDate(endDate)}  \u2022  ${prettyTime(startTime)} - ${prettyTime(endTime)}`
							: `${prettyDate(startDate)}  \u2022  ${prettyTime(startTime)} - ${prettyTime(endTime)}`
					}
				/>
				<SummaryCard
					label="Address"
					value={draft.addressLine || "No address set"}
				/>
				<SummaryCard
					label="Description"
					value={draft.description || "No description"}
				/>

				{/* Gradient CTA */}
				<TouchableOpacity
					onPress={handlePublish}
					disabled={!canPublish || publishing}
					activeOpacity={0.9}
					style={{ marginTop: 8 }}
				>
					<LinearGradient
						colors={["#DF6B4F", "#F9AD85"]}
						start={{ x: 0, y: 0.5 }}
						end={{ x: 1, y: 0.5 }}
						style={[
							styles.ctaBtn,
							(!canPublish || publishing) && { opacity: 0.5 },
						]}
					>
						<Text style={styles.ctaText}>
							{publishing ? "Publishing..." : "Publish Sale"}
						</Text>
					</LinearGradient>
				</TouchableOpacity>

				<View style={{ height: 40 }} />
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: "#F7F6F4" },

	header: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 8,
	},
	backChevron: {
		fontSize: 28,
		fontWeight: "700",
		color: "#23201C",
	},
	headerTitle: {
		flex: 1,
		textAlign: "center",
		fontSize: 18,
		fontWeight: "700",
		color: "#23201C",
	},

	content: {
		paddingHorizontal: 20,
		paddingTop: 4,
	},

	videoBox: {
		height: 140,
		borderRadius: 20,
		overflow: "hidden",
		backgroundColor: "#1F1F21",
		marginBottom: 12,
	},

	summaryCard: {
		backgroundColor: "rgba(255,255,255,0.45)",
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.25)",
		borderRadius: 16,
		paddingHorizontal: 16,
		paddingVertical: 12,
		marginBottom: 10,
	},
	summaryLabel: {
		fontSize: 12,
		fontWeight: "600",
		color: "#807A73",
		marginBottom: 4,
	},
	summaryValue: {
		fontSize: 15,
		fontWeight: "600",
		color: "#23201C",
	},

	ctaBtn: {
		borderRadius: 18,
		paddingVertical: 16,
		alignItems: "center",
		shadowColor: "#DF6B4F",
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.3,
		shadowRadius: 18,
		elevation: 6,
	},
	ctaText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "700",
	},
});
