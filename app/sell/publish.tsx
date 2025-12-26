import { ResizeMode, Video } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/contexts/AuthContext";
import { garageSaleService } from "@/services/garageSaleService";
import { rateLimitService } from "@/services/rateLimitService";

// keep relative so it works even if @ alias breaks in app/
import {
	clearSellDraft,
	loadSellDraft,
	saveSellDraft,
} from "../../lib/draftSale";

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

function formatDate(date: Date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function formatTime(date: Date) {
	const hours = String(date.getHours()).padStart(2, "0");
	const minutes = String(date.getMinutes()).padStart(2, "0");
	return `${hours}:${minutes}`;
}

export default function PublishScreen() {
	const params = useLocalSearchParams<{ videoUri?: string }>();
	const videoUri =
		typeof params.videoUri === "string" ? params.videoUri : undefined;

	const { user } = useAuth();

	const [analyzing, setAnalyzing] = useState(false);
	const [publishing, setPublishing] = useState(false);

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [categories, setCategories] = useState<string[]>([]);
	const [photos, setPhotos] = useState<string[]>([]);

	const [addressLine, setAddressLine] = useState("");
	const [coords, setCoords] = useState<{
		latitude: number;
		longitude: number;
	} | null>(null);

	const maxPhotos = 8;

	useEffect(() => {
		(async () => {
			// Load draft first (so if user comes back, they don’t lose work)
			try {
				const draft = await loadSellDraft();
				if (draft) {
					setTitle(draft.title || "");
					setDescription(draft.description || "");
					setCategories(
						Array.isArray(draft.categories) ? draft.categories : []
					);
					setPhotos(Array.isArray(draft.photos) ? draft.photos : []);
					setAddressLine(draft.addressLine || "");
					if (draft.coords?.latitude && draft.coords?.longitude) {
						setCoords({
							latitude: draft.coords.latitude,
							longitude: draft.coords.longitude,
						});
					}
				}
			} catch {}

			// Fetch location best-effort
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
				const addr = formatAddress(geos?.[0]) || "Your location";
				setAddressLine((prev) => prev || addr);

				await saveSellDraft({
					videoUri,
					title,
					description,
					photos,
					addressLine: addr,
					categories,
					coords: loc,
				});
			} catch {}
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Auto-save draft on changes
	useEffect(() => {
		saveSellDraft({
			videoUri,
			title,
			description,
			photos,
			addressLine,
			categories,
			coords,
		}).catch(() => {});
	}, [videoUri, title, description, photos, addressLine, categories, coords]);

	const analyzeVideo = async () => {
		setAnalyzing(true);
		await new Promise((resolve) => setTimeout(resolve, 1200));

		// only fill if empty (don’t overwrite edits)
		setTitle((t) => (t ? t : "Multi-Family Garage Sale"));
		setDescription((d) =>
			d ? d : "Furniture, electronics, books, and household items"
		);
		setCategories((c) =>
			c?.length ? c : ["Furniture", "Electronics", "Books", "Clothing"]
		);

		setAnalyzing(false);
	};

	useEffect(() => {
		if (videoUri) analyzeVideo();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [videoUri]);

	const onUploadPhotos = async () => {
		const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (!perm.granted) {
			Alert.alert(
				"Photos Permission",
				"Please allow photo access to upload images."
			);
			return;
		}

		const remaining = maxPhotos - photos.length;
		if (remaining <= 0) {
			Alert.alert("Limit reached", `You can upload up to ${maxPhotos} photos.`);
			return;
		}

		const res = await ImagePicker.launchImageLibraryAsync({
			allowsMultipleSelection: true,
			selectionLimit: remaining,
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			quality: 0.9,
		});

		if (!res.canceled) {
			const uris = res.assets.map((a) => a.uri);
			setPhotos((prev) => [...prev, ...uris].slice(0, maxPhotos));
		}
	};

	const removePhoto = (uri: string) => {
		setPhotos((prev) => prev.filter((p) => p !== uri));
	};

	const canPublish = useMemo(() => {
		return title.trim().length > 0 && description.trim().length > 0 && !!coords;
	}, [title, description, coords]);

	const onPublish = async () => {
		if (publishing) return;

		if (!canPublish) {
			Alert.alert(
				"Missing info",
				!coords
					? "We need your location to pin the sale on the map. Please enable location permission."
					: "Please add at least a title and description before publishing."
			);
			return;
		}

		setPublishing(true);
		try {
			const deviceId = await rateLimitService.getDeviceId();

			// For now: publish as a simple single-day sale, 9am-5pm default.
			// You can wire real date/time pickers later.
			const start = new Date();
			const end = new Date();
			end.setHours(Math.min(23, start.getHours() + 6));

			await garageSaleService.addGarageSale(
				{
					title: title.trim(),
					description: description.trim(),
					location: {
						latitude: coords!.latitude,
						longitude: coords!.longitude,
						address: addressLine || "Your location",
					},
					date: formatDate(start),
					startDate: formatDate(start),
					endDate: formatDate(start),
					startTime: formatTime(start),
					endTime: formatTime(end),
					categories,
					contactName: user?.email || "Seller",
					contactPhone: undefined,
					contactEmail: user?.email || undefined,
					videoUrl: videoUri || undefined,
					images: photos.length ? photos : undefined,
					isActive: true,
				},
				deviceId,
				user?.id
			);

			await clearSellDraft();

			Alert.alert("Success", "Your garage sale is live!", [
				{
					text: "OK",
					onPress: () => {
						// Go back to Discover. Discover auto-refreshes via useFocusEffect.
						router.replace("/(tabs)");
					},
				},
			]);
		} catch (e: any) {
			console.error("Publish error:", e);
			Alert.alert(
				"Error",
				e?.message || "Failed to publish. Please try again."
			);
		} finally {
			setPublishing(false);
		}
	};

	const goBack = () => {
		if (router.canGoBack()) router.back();
		else router.replace("/(tabs)");
	};

	return (
		<View style={styles.safe}>
			<View style={styles.header}>
				<TouchableOpacity onPress={goBack} style={styles.backBtn}>
					<IconSymbol size={24} name="chevron.left" color="#1F1F1F" />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Review & Publish</Text>
				<View style={styles.placeholder} />
			</View>

			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				{videoUri ? (
					<View style={styles.videoBox}>
						<Video
							source={{ uri: videoUri }}
							style={styles.video}
							useNativeControls
							resizeMode={ResizeMode.COVER}
							isLooping
						/>
					</View>
				) : (
					<View style={styles.noVideoBox}>
						<IconSymbol size={48} name="video" color="#9A928A" />
						<Text style={styles.noVideoText}>No video recorded</Text>
					</View>
				)}

				{analyzing && (
					<View style={styles.analyzingCard}>
						<ActivityIndicator size="small" color="#D97B3F" />
						<Text style={styles.analyzingText}>
							AI is analyzing your video...
						</Text>
					</View>
				)}

				<View style={styles.card}>
					<View style={styles.cardHeader}>
						<IconSymbol size={20} name="tag" color="#D97B3F" />
						<Text style={styles.cardTitle}>Details</Text>
					</View>

					<Text style={styles.label}>Title</Text>
					<TextInput
						value={title}
						onChangeText={setTitle}
						placeholder="e.g. Garage Sale"
						style={styles.input}
					/>

					<Text style={styles.label}>Description</Text>
					<TextInput
						value={description}
						onChangeText={setDescription}
						placeholder="What are you selling?"
						style={[styles.input, styles.textarea]}
						multiline
					/>

					<Text style={styles.label}>Categories (comma separated)</Text>
					<TextInput
						value={categories.join(", ")}
						onChangeText={(t) =>
							setCategories(
								t
									.split(",")
									.map((s) => s.trim())
									.filter(Boolean)
							)
						}
						placeholder="Furniture, Electronics, Toys"
						style={styles.input}
					/>
				</View>

				<View style={styles.card}>
					<View style={styles.cardHeader}>
						<IconSymbol size={20} name="location.fill" color="#D97B3F" />
						<Text style={styles.cardTitle}>Location</Text>
					</View>
					<Text style={styles.locationText}>
						{addressLine || "Fetching your location..."}
					</Text>
					{!coords && (
						<Text style={styles.locationHint}>
							Enable location permission so your sale can appear on the map.
						</Text>
					)}
				</View>

				<TouchableOpacity
					style={styles.dashedUpload}
					onPress={onUploadPhotos}
					activeOpacity={0.8}
				>
					<IconSymbol size={24} name="square.and.arrow.up" color="#D97B3F" />
					<Text style={styles.dashedText}>
						Upload Additional Photos {photos.length > 0 && `(${photos.length})`}
					</Text>
				</TouchableOpacity>

				{photos.length > 0 && (
					<View style={styles.photoGrid}>
						{photos.map((uri) => (
							<View key={uri} style={styles.photoItem}>
								<Image source={{ uri }} style={styles.photo} />
								<TouchableOpacity
									style={styles.removePhoto}
									onPress={() => removePhoto(uri)}
								>
									<Text style={styles.removePhotoText}>×</Text>
								</TouchableOpacity>
							</View>
						))}
					</View>
				)}

				<TouchableOpacity
					style={[
						styles.publishBtn,
						(!canPublish || publishing) && { opacity: 0.6 },
					]}
					onPress={onPublish}
					activeOpacity={0.92}
					disabled={!canPublish || publishing}
				>
					<Text style={styles.publishText}>
						{publishing ? "Publishing..." : "Publish Sale"}
					</Text>
				</TouchableOpacity>

				<View style={{ height: 120 }} />
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: "#FAF7F2" },

	header: {
		paddingTop: 60,
		paddingBottom: 16,
		paddingHorizontal: 20,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		backgroundColor: "#FAF7F2",
		borderBottomWidth: 1,
		borderBottomColor: "#E6E1DA",
	},
	backBtn: {
		width: 40,
		height: 40,
		alignItems: "center",
		justifyContent: "center",
	},
	headerTitle: { fontSize: 20, fontWeight: "700", color: "#1F1F1F" },
	placeholder: { width: 40 },

	content: { paddingHorizontal: 18, paddingTop: 20 },

	videoBox: {
		height: 200,
		borderRadius: 18,
		backgroundColor: "#000",
		overflow: "hidden",
		marginBottom: 12,
	},
	video: { width: "100%", height: "100%" },
	noVideoBox: {
		height: 200,
		borderRadius: 18,
		backgroundColor: "#F1EDE6",
		borderWidth: 1,
		borderColor: "#E6E1DA",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 12,
	},
	noVideoText: {
		marginTop: 12,
		fontSize: 15,
		fontWeight: "600",
		color: "#6F6A64",
	},

	analyzingCard: {
		backgroundColor: "#FFF",
		borderWidth: 1,
		borderColor: "#E6E1DA",
		borderRadius: 18,
		padding: 20,
		marginBottom: 14,
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	analyzingText: { fontSize: 15, fontWeight: "600", color: "#6F6A64" },

	card: {
		backgroundColor: "#FFF",
		borderWidth: 1,
		borderColor: "#E6E1DA",
		borderRadius: 18,
		padding: 18,
		marginBottom: 14,
	},
	cardHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		marginBottom: 12,
	},
	cardTitle: { fontSize: 16, fontWeight: "800", color: "#1F1F1F" },

	label: {
		fontSize: 13,
		fontWeight: "700",
		color: "#6F6A64",
		marginTop: 10,
		marginBottom: 6,
	},
	input: {
		borderWidth: 1,
		borderColor: "#E6E1DA",
		borderRadius: 12,
		paddingHorizontal: 12,
		paddingVertical: 10,
		backgroundColor: "#FAF7F2",
		fontSize: 15,
		color: "#1F1F1F",
	},
	textarea: { minHeight: 90, textAlignVertical: "top" },

	locationText: { fontSize: 15, fontWeight: "700", color: "#1F1F1F" },
	locationHint: { marginTop: 8, fontSize: 13, color: "#6F6A64" },

	dashedUpload: {
		borderWidth: 1,
		borderColor: "#D97B3F",
		borderStyle: "dashed",
		borderRadius: 18,
		padding: 16,
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		backgroundColor: "#FFF",
		marginBottom: 12,
	},
	dashedText: { fontSize: 15, fontWeight: "700", color: "#D97B3F" },

	photoGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 10,
		marginBottom: 14,
	},
	photoItem: {
		width: 90,
		height: 90,
		borderRadius: 14,
		overflow: "hidden",
		position: "relative",
	},
	photo: { width: "100%", height: "100%" },
	removePhoto: {
		position: "absolute",
		top: 6,
		right: 6,
		width: 22,
		height: 22,
		borderRadius: 11,
		backgroundColor: "rgba(0,0,0,0.65)",
		alignItems: "center",
		justifyContent: "center",
	},
	removePhotoText: {
		color: "#fff",
		fontSize: 18,
		lineHeight: 18,
		fontWeight: "800",
	},

	publishBtn: {
		backgroundColor: "#D97B3F",
		borderRadius: 18,
		paddingVertical: 16,
		alignItems: "center",
		marginTop: 6,
	},
	publishText: { fontSize: 16, fontWeight: "800", color: "#fff" },
});
