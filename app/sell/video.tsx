// app/sell/video.tsx — Step 2: Sale Details
import GradientBackground from "@/components/ui/GradientBackground";
import ProgressBar from "@/components/ui/ProgressBar";
import { analyzeGarageSaleVideo } from "@/lib/claude";
import { loadSellDraft, saveSellDraft } from "@/lib/draftSale";
import { MaterialIcons } from "@expo/vector-icons";
import { EncodingType, readAsStringAsync } from "expo-file-system/legacy";
import { useVideoPlayer, VideoView } from "expo-video";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import * as VideoThumbnails from "expo-video-thumbnails";
import {
	ActivityIndicator,
	Alert,
	SafeAreaView,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

function formatAddress(p: Location.LocationGeocodedAddress | undefined) {
	if (!p) return "";
	const parts = [
		p.streetNumber,
		p.street,
		p.city,
		p.region,
		p.postalCode,
	].filter(Boolean);
	return parts.join(" ");
}

export default function ReviewScreen() {
	const params = useLocalSearchParams<{ videoUri?: string }>();
	const videoUri =
		typeof params.videoUri === "string" ? params.videoUri : undefined;

	const [loading, setLoading] = useState(true);
	const [analyzing, setAnalyzing] = useState(false);

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [categories, setCategories] = useState<string[]>([]);
	const [addressLine, setAddressLine] = useState("");
	const [coords, setCoords] = useState<{
		latitude: number;
		longitude: number;
	} | null>(null);

	useEffect(() => {
		let mounted = true;

		(async () => {
			try {
				const draft = await loadSellDraft();
				if (!mounted) return;

				if (draft) {
					setTitle(draft.title || "");
					setDescription(draft.description || "");
					setCategories(
						Array.isArray(draft.categories) ? draft.categories : []
					);
					setAddressLine(draft.addressLine || "");
					if (draft.coords?.latitude && draft.coords?.longitude) {
						setCoords({
							latitude: draft.coords.latitude,
							longitude: draft.coords.longitude,
						});
					}
				}

				if (videoUri) {
					await saveSellDraft({ ...(draft || {}), videoUri });
				}
			} finally {
				if (mounted) setLoading(false);
			}
		})();

		return () => {
			mounted = false;
		};
	}, [videoUri]);

	// Auto-save
	useEffect(() => {
		if (loading) return;
		saveSellDraft({
			videoUri,
			title,
			description,
			categories,
			addressLine,
			coords: coords ?? undefined,
		}).catch(() => {});
	}, [loading, videoUri, title, description, categories, addressLine, coords]);

	// Auto-detect location
	useEffect(() => {
		if (!addressLine) {
			(async () => {
				try {
					const perm = await Location.requestForegroundPermissionsAsync();
					if (perm.status !== "granted") return;
					const pos = await Location.getCurrentPositionAsync({});
					const loc = {
						latitude: pos.coords.latitude,
						longitude: pos.coords.longitude,
					};
					setCoords(loc);
					const geos = await Location.reverseGeocodeAsync(loc);
					setAddressLine(formatAddress(geos?.[0]) || "");
				} catch {}
			})();
		}
	}, []);

	// Analyze video with Claude AI
	const analyzeVideo = async (uri: string) => {
		setAnalyzing(true);
		try {
			// Extract 3 frames from the video
			const thumbnails = await Promise.all(
				[0, 2500, 4500].map((time) =>
					VideoThumbnails.getThumbnailAsync(uri, { time })
				)
			);

			// Convert to base64
			const base64Frames = await Promise.all(
				thumbnails.map((t) =>
					readAsStringAsync(t.uri, { encoding: EncodingType.Base64 })
				)
			);

			// Call Claude
			const analysis = await analyzeGarageSaleVideo(base64Frames);

			setTitle((t) => t || analysis.title);
			setDescription((d) => d || analysis.description);
			setCategories((c) => (c?.length ? c : analysis.categories));
		} catch (error) {
			console.error("Video analysis failed:", error);
			// Silently fail — user can fill in manually
		} finally {
			setAnalyzing(false);
		}
	};

	useEffect(() => {
		if (videoUri) analyzeVideo(videoUri);
	}, [videoUri]);

	const player = useVideoPlayer(videoUri ?? null, (p) => {
		p.loop = true;
	});

	const canContinue = useMemo(() => {
		return title.trim().length > 0 && description.trim().length > 0;
	}, [title, description]);

	const onContinue = () => {
		if (!canContinue) {
			Alert.alert(
				"Missing info",
				"Please add a title and description to continue."
			);
			return;
		}
		router.push("/sell/publish");
	};

	const goBack = () => {
		if (router.canGoBack()) router.back();
		else router.replace("/(tabs)");
	};

	if (loading) return null;

	return (
		<SafeAreaView style={styles.safe}>
			<GradientBackground />

			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity onPress={goBack}>
					<Text style={styles.backChevron}>{"\u2039"}</Text>
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Sale Details</Text>
				<View style={{ width: 20 }} />
			</View>

			<ProgressBar step={2} />

			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				{/* Video Preview */}
				{videoUri && (
					<View style={styles.videoBox}>
						<VideoView
							player={player}
							style={StyleSheet.absoluteFill}
							nativeControls
							contentFit="cover"
						/>
					</View>
				)}

				{analyzing && (
					<View style={styles.analyzingRow}>
						<ActivityIndicator size="small" color="#DF6B4F" />
						<Text style={styles.analyzingText}>
							AI is analyzing your video...
						</Text>
					</View>
				)}

				{/* Glass Inputs */}
				<View style={styles.fieldGroup}>
					<Text style={styles.label}>Sale Title</Text>
					<TextInput
						style={styles.glassInput}
						value={title}
						onChangeText={setTitle}
						placeholder="e.g. Weekend Garage Sale"
						placeholderTextColor="#807A73"
					/>
				</View>

				<View style={styles.fieldGroup}>
					<Text style={styles.label}>Description</Text>
					<TextInput
						style={[styles.glassInput, styles.textArea]}
						value={description}
						onChangeText={setDescription}
						placeholder="Describe what you're selling..."
						placeholderTextColor="#807A73"
						multiline
					/>
				</View>

				<View style={styles.fieldGroup}>
					<Text style={styles.label}>Address</Text>
					<TextInput
						style={styles.glassInput}
						value={addressLine}
						onChangeText={setAddressLine}
						placeholder="Enter your address"
						placeholderTextColor="#807A73"
					/>
				</View>

				{/* Gradient CTA */}
				<TouchableOpacity
					onPress={onContinue}
					disabled={!canContinue}
					activeOpacity={0.9}
					style={{ marginTop: 8 }}
				>
					<LinearGradient
						colors={["#DF6B4F", "#F9AD85"]}
						start={{ x: 0, y: 0.5 }}
						end={{ x: 1, y: 0.5 }}
						style={[styles.ctaBtn, !canContinue && { opacity: 0.5 }]}
					>
						<Text style={styles.ctaText}>Next: Review & Publish</Text>
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
		marginBottom: 16,
	},

	analyzingRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		marginBottom: 12,
	},
	analyzingText: {
		fontSize: 14,
		fontWeight: "600",
		color: "#807A73",
	},

	fieldGroup: {
		marginBottom: 14,
	},
	label: {
		fontSize: 14,
		fontWeight: "600",
		color: "#23201C",
		marginBottom: 8,
	},
	glassInput: {
		backgroundColor: "rgba(255,255,255,0.5)",
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.3)",
		borderRadius: 16,
		paddingHorizontal: 16,
		paddingVertical: 14,
		fontSize: 15,
		color: "#23201C",
	},
	textArea: {
		minHeight: 80,
		textAlignVertical: "top",
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
