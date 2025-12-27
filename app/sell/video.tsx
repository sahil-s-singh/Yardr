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
import { loadSellDraft, saveSellDraft } from "@/lib/draftSale";

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

function StepHeader({ step }: { step: 1 | 2 | 3 }) {
	return (
		<View style={styles.stepWrap}>
			<Text style={styles.screenTitle}>Add Sale</Text>

			<View style={styles.stepsRow}>
				<View style={styles.stepItem}>
					<View style={[styles.stepCircle, step >= 1 && styles.stepActive]}>
						<IconSymbol
							size={20}
							name="video"
							color={step >= 1 ? "#fff" : "#6F6A64"}
						/>
					</View>
					<Text style={[styles.stepLabel, step >= 1 && styles.stepLabelActive]}>
						Record Video
					</Text>
				</View>

				<View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />

				<View style={styles.stepItem}>
					<View style={[styles.stepCircle, step >= 2 && styles.stepActive]}>
						<IconSymbol
							size={20}
							name="eye"
							color={step >= 2 ? "#fff" : "#6F6A64"}
						/>
					</View>
					<Text style={[styles.stepLabel, step >= 2 && styles.stepLabelActive]}>
						Review
					</Text>
				</View>

				<View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />

				<View style={styles.stepItem}>
					<View style={[styles.stepCircle, step >= 3 && styles.stepActive]}>
						<IconSymbol
							size={20}
							name="checkmark"
							color={step >= 3 ? "#fff" : "#6F6A64"}
						/>
					</View>
					<Text style={[styles.stepLabel, step >= 3 && styles.stepLabelActive]}>
						Publish
					</Text>
				</View>
			</View>
		</View>
	);
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
	const [photos, setPhotos] = useState<string[]>([]);
	const [addressLine, setAddressLine] = useState("");
	const [coords, setCoords] = useState<{
		latitude: number;
		longitude: number;
	} | null>(null);

	const maxPhotos = 8;

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
					setPhotos(Array.isArray(draft.photos) ? draft.photos : []);
					setAddressLine(draft.addressLine || "");
					if (draft.coords?.latitude && draft.coords?.longitude) {
						setCoords({
							latitude: draft.coords.latitude,
							longitude: draft.coords.longitude,
						});
					}
				}

				// If we arrived with a new video, store it.
				if (videoUri) {
					await saveSellDraft({
						...(draft || {}),
						videoUri,
					});
				}
			} finally {
				if (mounted) setLoading(false);
			}
		})();

		return () => {
			mounted = false;
		};
	}, [videoUri]);

	// auto-save changes
	useEffect(() => {
		if (loading) return;
		saveSellDraft({
			videoUri,
			title,
			description,
			categories,
			photos,
			addressLine,
			coords,
		}).catch(() => {});
	}, [
		loading,
		videoUri,
		title,
		description,
		categories,
		photos,
		addressLine,
		coords,
	]);

	const analyzeVideo = async () => {
		setAnalyzing(true);
		await new Promise((r) => setTimeout(r, 900));

		// only fill if empty
		setTitle((t) => (t ? t : "Multi-Family Garage Sale"));
		setDescription((d) =>
			d ? d : "Furniture, electronics, books, and household items"
		);
		setCategories((c) =>
			c?.length
				? c
				: ["Garden", "Electronics", "Sports", "Art", "Furniture", "Appliances"]
		);

		setAnalyzing(false);
	};

	useEffect(() => {
		if (videoUri) analyzeVideo();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [videoUri]);

	const refreshLocation = async () => {
		try {
			const perm = await Location.requestForegroundPermissionsAsync();
			if (perm.status !== "granted") {
				Alert.alert(
					"Location",
					"Please allow location permission to detect your sale location."
				);
				return;
			}

			const pos = await Location.getCurrentPositionAsync({});
			const loc = {
				latitude: pos.coords.latitude,
				longitude: pos.coords.longitude,
			};
			setCoords(loc);

			const geos = await Location.reverseGeocodeAsync(loc);
			const addr = formatAddress(geos?.[0]) || "Your location";
			setAddressLine(addr);

			await saveSellDraft({
				videoUri,
				title,
				description,
				categories,
				photos,
				addressLine: addr,
				coords: loc,
			});
		} catch {
			Alert.alert("Location", "Unable to detect location. Please try again.");
		}
	};

	const onUploadPhotos = async () => {
		const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (!perm.granted) {
			Alert.alert("Photos", "Please allow photo access to upload images.");
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

	const removePhoto = (uri: string) =>
		setPhotos((p) => p.filter((x) => x !== uri));

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
		<View style={styles.safe}>
			<View style={styles.topBar}>
				<TouchableOpacity onPress={goBack} style={styles.backBtn}>
					<IconSymbol size={24} name="chevron.left" color="#1F1F1F" />
				</TouchableOpacity>
				<View style={{ width: 40 }} />
			</View>

			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<StepHeader step={2} />

				<Text style={styles.sectionTitle}>Video Preview</Text>
				<View style={styles.videoBox}>
					{videoUri ? (
						<Video
							source={{ uri: videoUri }}
							style={styles.video}
							useNativeControls
							resizeMode={ResizeMode.COVER}
							isLooping
						/>
					) : (
						<View style={styles.noVideoBox}>
							<Text style={styles.noVideoText}>No video recorded</Text>
						</View>
					)}
				</View>

				{analyzing && (
					<View style={styles.analyzingCard}>
						<ActivityIndicator size="small" color="#D97B3F" />
						<Text style={styles.analyzingText}>
							AI is analyzing your video...
						</Text>
					</View>
				)}

				<View style={styles.card}>
					<Text style={styles.cardTitle}>Details</Text>

					<Text style={styles.label}>Title *</Text>
					<TextInput
						style={styles.input}
						value={title}
						onChangeText={setTitle}
						placeholder="e.g. Garage Sale"
					/>

					<Text style={styles.label}>Description *</Text>
					<TextInput
						style={[styles.input, styles.textarea]}
						value={description}
						onChangeText={setDescription}
						placeholder="What are you selling?"
						multiline
					/>
				</View>

				<View style={styles.card}>
					<View style={styles.rowHeader}>
						<IconSymbol size={18} name="tag" color="#D97B3F" />
						<Text style={styles.cardTitle}>AI-Generated Tags</Text>
					</View>

					<View style={styles.chips}>
						{categories.map((c) => (
							<View key={c} style={styles.chip}>
								<Text style={styles.chipText}>{c}</Text>
							</View>
						))}
						{categories.length === 0 && (
							<Text style={styles.muted}>No tags yet</Text>
						)}
					</View>
				</View>

				<View style={styles.card}>
					<View style={styles.rowHeader}>
						<IconSymbol size={18} name="location.fill" color="#D97B3F" />
						<Text style={styles.cardTitle}>Detected Location</Text>
					</View>

					<View style={styles.locationRow}>
						<Text style={styles.locationText}>
							{addressLine ? addressLine : "Location not available"}
						</Text>
						<TouchableOpacity
							onPress={refreshLocation}
							style={styles.refreshBtn}
						>
							<Text style={styles.refreshText}>Refresh</Text>
						</TouchableOpacity>
					</View>

					{!coords && (
						<Text style={styles.locationHint}>
							Enable location permission so your sale can appear on the map.
						</Text>
					)}
				</View>

				<Text style={styles.sectionTitle}>Additional Photos</Text>

				<View style={styles.photoGrid}>
					<TouchableOpacity
						style={styles.addTile}
						onPress={onUploadPhotos}
						activeOpacity={0.85}
					>
						<Text style={styles.plus}>＋</Text>
						<Text style={styles.addLabel}>Add Photo</Text>
					</TouchableOpacity>

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

				<View style={{ height: 110 }} />
			</ScrollView>

			<View style={styles.bottomBar}>
				<TouchableOpacity
					style={[styles.primaryBtn, !canContinue && { opacity: 0.5 }]}
					onPress={onContinue}
					disabled={!canContinue}
					activeOpacity={0.92}
				>
					<Text style={styles.primaryText}>Continue</Text>
					<Text style={styles.primaryArrow}>→</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: "#FAF7F2" },

	topBar: {
		paddingTop: 56,
		paddingHorizontal: 18,
		paddingBottom: 8,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	backBtn: {
		width: 40,
		height: 40,
		alignItems: "center",
		justifyContent: "center",
	},

	content: { paddingHorizontal: 18, paddingTop: 6 },

	screenTitle: {
		textAlign: "center",
		fontSize: 22,
		fontWeight: "800",
		color: "#1F1F1F",
	},

	stepWrap: { marginBottom: 10 },
	stepsRow: {
		marginTop: 14,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
	},
	stepItem: { alignItems: "center", width: 110 },
	stepCircle: {
		width: 52,
		height: 52,
		borderRadius: 26,
		backgroundColor: "#F1EDE6",
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: "#E6E1DA",
	},
	stepActive: { backgroundColor: "#D97B3F", borderColor: "#D97B3F" },
	stepLabel: {
		marginTop: 8,
		fontSize: 13,
		color: "#6F6A64",
		fontWeight: "700",
	},
	stepLabelActive: { color: "#D97B3F" },
	stepLine: {
		height: 4,
		width: 44,
		borderRadius: 2,
		backgroundColor: "#E6E1DA",
	},
	stepLineActive: { backgroundColor: "#D97B3F" },

	sectionTitle: {
		marginTop: 8,
		marginBottom: 10,
		fontSize: 16,
		fontWeight: "800",
		color: "#1F1F1F",
	},

	videoBox: {
		height: 210,
		borderRadius: 18,
		overflow: "hidden",
		backgroundColor: "#000",
	},
	video: { width: "100%", height: "100%" },
	noVideoBox: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#F1EDE6",
	},
	noVideoText: { color: "#6F6A64", fontWeight: "700" },

	analyzingCard: {
		marginTop: 12,
		backgroundColor: "#FFF",
		borderWidth: 1,
		borderColor: "#E6E1DA",
		borderRadius: 18,
		padding: 16,
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},
	analyzingText: { fontSize: 14, fontWeight: "700", color: "#6F6A64" },

	card: {
		marginTop: 14,
		backgroundColor: "#FFF",
		borderWidth: 1,
		borderColor: "#E6E1DA",
		borderRadius: 18,
		padding: 16,
	},
	rowHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		marginBottom: 12,
	},
	cardTitle: { fontSize: 16, fontWeight: "800", color: "#1F1F1F" },

	label: {
		marginTop: 10,
		marginBottom: 6,
		fontSize: 13,
		color: "#6F6A64",
		fontWeight: "800",
	},
	input: {
		borderWidth: 1,
		borderColor: "#E6E1DA",
		borderRadius: 14,
		paddingHorizontal: 12,
		paddingVertical: 12,
		backgroundColor: "#FAF7F2",
		fontSize: 15,
	},
	textarea: { minHeight: 90, textAlignVertical: "top" },

	chips: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
	chip: {
		backgroundColor: "#F7E6D9",
		paddingVertical: 8,
		paddingHorizontal: 14,
		borderRadius: 999,
	},
	chipText: { color: "#D97B3F", fontWeight: "800" },
	muted: { color: "#6F6A64", fontWeight: "700" },

	locationRow: {
		borderWidth: 1,
		borderColor: "#E6E1DA",
		borderRadius: 14,
		backgroundColor: "#FAF7F2",
		paddingHorizontal: 12,
		paddingVertical: 14,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 12,
	},
	locationText: { flex: 1, fontSize: 15, fontWeight: "700", color: "#1F1F1F" },
	refreshBtn: {
		paddingHorizontal: 14,
		paddingVertical: 10,
		borderRadius: 12,
		backgroundColor: "#FFF",
		borderWidth: 1,
		borderColor: "#E6E1DA",
	},
	refreshText: { fontWeight: "800", color: "#1F1F1F" },
	locationHint: { marginTop: 10, color: "#6F6A64", fontWeight: "700" },

	photoGrid: { marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 12 },
	addTile: {
		width: 110,
		height: 110,
		borderRadius: 18,
		borderWidth: 2,
		borderStyle: "dashed",
		borderColor: "#E6E1DA",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#FAF7F2",
	},
	plus: { fontSize: 34, color: "#6F6A64", marginBottom: 4 },
	addLabel: { fontWeight: "800", color: "#6F6A64" },

	photoItem: { width: 110, height: 110, borderRadius: 18, overflow: "hidden" },
	photo: { width: "100%", height: "100%" },
	removePhoto: {
		position: "absolute",
		top: 6,
		right: 6,
		width: 26,
		height: 26,
		borderRadius: 13,
		backgroundColor: "rgba(0,0,0,0.55)",
		alignItems: "center",
		justifyContent: "center",
	},
	removePhotoText: { color: "#fff", fontSize: 18, marginTop: -2 },

	bottomBar: {
		position: "absolute",
		left: 0,
		right: 0,
		bottom: 0,
		padding: 16,
		backgroundColor: "rgba(250,247,242,0.92)",
		borderTopWidth: 1,
		borderTopColor: "#E6E1DA",
	},
	primaryBtn: {
		backgroundColor: "#D97B3F",
		borderRadius: 24,
		paddingVertical: 18,
		paddingHorizontal: 22,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 10,
	},
	primaryText: { color: "#fff", fontWeight: "900", fontSize: 18 },
	primaryArrow: { color: "#fff", fontWeight: "900", fontSize: 18 },
});
