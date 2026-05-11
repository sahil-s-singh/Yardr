// app/sell/video.tsx — Step 2: Sale Details
import AddressAutocomplete from "@/components/ui/AddressAutocomplete";
import GradientBackground from "@/components/ui/GradientBackground";
import ProgressBar from "@/components/ui/ProgressBar";
import { analyzeGarageSaleVideo } from "@/lib/claude";
import { loadSellDraft, saveSellDraft } from "@/lib/draftSale";
import { salePhotosService } from "@/services/salePhotosService";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { MaterialIcons } from "@expo/vector-icons";
import { EncodingType, readAsStringAsync } from "expo-file-system/legacy";
import { useVideoPlayer, VideoView } from "expo-video";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import * as VideoThumbnails from "expo-video-thumbnails";
import {
	ActivityIndicator,
	Alert,
	Image,
	KeyboardAvoidingView,
	Platform,
	SafeAreaView,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

function yyyyMmDd(d: Date) {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

function hhmm(d: Date) {
	const h = String(d.getHours()).padStart(2, "0");
	const m = String(d.getMinutes()).padStart(2, "0");
	return `${h}:${m}`;
}

function getNextSaturday(): Date {
	const today = new Date();
	const dayOfWeek = today.getDay();
	const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
	const d = new Date(today);
	d.setDate(today.getDate() + daysUntilSaturday);
	d.setHours(10, 0, 0, 0);
	return d;
}

function prettyDate(d: Date) {
	return d.toLocaleDateString("en-US", {
		weekday: "short",
		month: "short",
		day: "numeric",
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
	const [contactPhone, setContactPhone] = useState("");
	const [photos, setPhotos] = useState<string[]>([]);
	const [coords, setCoords] = useState<{
		latitude: number;
		longitude: number;
	} | null>(null);

	const defaultStart = useMemo(() => getNextSaturday(), []);
	const [startDate, setStartDate] = useState<Date>(defaultStart);
	const [endDate, setEndDate] = useState<Date>(defaultStart);
	const [startTime, setStartTime] = useState("10:00");
	const [endTime, setEndTime] = useState("14:00");
	const [showStartDatePicker, setShowStartDatePicker] = useState(false);
	const [showEndDatePicker, setShowEndDatePicker] = useState(false);
	const [showStartPicker, setShowStartPicker] = useState(false);
	const [showEndPicker, setShowEndPicker] = useState(false);

	const startTimeDate = useMemo(() => {
		const d = new Date(startDate);
		const [h, m] = startTime.split(":").map(Number);
		d.setHours(h, m, 0, 0);
		return d;
	}, [startDate, startTime]);

	const endTimeDate = useMemo(() => {
		const d = new Date(startDate);
		const [h, m] = endTime.split(":").map(Number);
		d.setHours(h, m, 0, 0);
		return d;
	}, [startDate, endTime]);

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
					if (draft.startDate) {
						const parsed = new Date(draft.startDate + "T00:00:00");
						if (!isNaN(parsed.getTime())) setStartDate(parsed);
					}
					if (draft.endDate) {
						const parsed = new Date(draft.endDate + "T00:00:00");
						if (!isNaN(parsed.getTime())) setEndDate(parsed);
					}
					if (draft.startTime) setStartTime(draft.startTime);
					if (draft.endTime) setEndTime(draft.endTime);
					if (draft.contactPhone) setContactPhone(draft.contactPhone);
					if (Array.isArray(draft.photos)) setPhotos(draft.photos);
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
			startDate: yyyyMmDd(startDate),
			endDate: yyyyMmDd(endDate),
			startTime,
			endTime,
			contactPhone: contactPhone.trim() || undefined,
			photos,
		}).catch(() => {});
	}, [loading, videoUri, title, description, categories, addressLine, coords, startDate, endDate, startTime, endTime, contactPhone, photos]);

	const handleAddPhotos = async () => {
		if (photos.length >= salePhotosService.MAX_PHOTOS) {
			Alert.alert(
				"Photo limit reached",
				`You can attach up to ${salePhotosService.MAX_PHOTOS} photos.`,
			);
			return;
		}
		const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (!perm.granted) {
			Alert.alert(
				"Permission required",
				"Allow photo library access to attach photos.",
			);
			return;
		}
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsMultipleSelection: true,
			selectionLimit: salePhotosService.MAX_PHOTOS - photos.length,
			quality: 0.8,
		});
		if (result.canceled || !result.assets?.length) return;
		const next = [...photos, ...result.assets.map((a) => a.uri)].slice(
			0,
			salePhotosService.MAX_PHOTOS,
		);
		setPhotos(next);
	};

	const handleRemovePhoto = (uri: string) => {
		setPhotos((prev) => prev.filter((p) => p !== uri));
	};

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

	const runAnalysis = async (base64Frames: string[]) => {
		setAnalyzing(true);
		try {
			const analysis = await analyzeGarageSaleVideo(base64Frames);
			setTitle((t) => t || analysis.title);
			setDescription((d) => d || analysis.description);
			setCategories((c) => (c?.length ? c : analysis.categories));
		} catch (error) {
			console.error("AI analysis failed:", error);
		} finally {
			setAnalyzing(false);
		}
	};

	// Analyze video frames (preferred) or fall back to uploaded photos
	useEffect(() => {
		if (loading) return;
		(async () => {
			if (videoUri) {
				try {
					const thumbnails = await Promise.all(
						[0, 2500, 4500].map((time) =>
							VideoThumbnails.getThumbnailAsync(videoUri, { time })
						)
					);
					const base64Frames = await Promise.all(
						thumbnails.map((t) =>
							readAsStringAsync(t.uri, { encoding: EncodingType.Base64 })
						)
					);
					await runAnalysis(base64Frames);
				} catch (error) {
					console.error("Video frame extraction failed:", error);
				}
			} else if (photos.length > 0) {
				try {
					const base64Frames = await Promise.all(
						photos.slice(0, 3).map((uri) =>
							readAsStringAsync(uri, { encoding: EncodingType.Base64 })
						)
					);
					await runAnalysis(base64Frames);
				} catch (error) {
					console.error("Photo analysis failed:", error);
				}
			}
		})();
	}, [videoUri, loading]);

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

			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				keyboardVerticalOffset={0}
			>
			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
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

				{/* Photos */}
				<View style={styles.fieldGroup}>
					<View style={styles.photosHeader}>
						<Text style={styles.label}>Photos</Text>
						<Text style={styles.photosCount}>
							{photos.length}/{salePhotosService.MAX_PHOTOS}
						</Text>
					</View>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.photosStrip}
					>
						{photos.map((uri) => (
							<View key={uri} style={styles.photoTile}>
								<Image source={{ uri }} style={styles.photoThumb} />
								<TouchableOpacity
									style={styles.photoRemove}
									onPress={() => handleRemovePhoto(uri)}
									hitSlop={6}
								>
									<MaterialIcons name="close" size={14} color="#fff" />
								</TouchableOpacity>
							</View>
						))}
						{photos.length < salePhotosService.MAX_PHOTOS ? (
							<TouchableOpacity
								style={styles.photoAddTile}
								onPress={handleAddPhotos}
								activeOpacity={0.85}
							>
								<MaterialIcons name="add" size={28} color="#807A73" />
								<Text style={styles.photoAddLabel}>Add</Text>
							</TouchableOpacity>
						) : null}
					</ScrollView>
				</View>

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

				<View style={styles.timeRow}>
					<View style={[styles.fieldGroup, styles.timeCol]}>
						<Text style={styles.label}>Start Date</Text>
						<TouchableOpacity
							style={styles.glassInput}
							onPress={() => setShowStartDatePicker(true)}
						>
							<Text style={styles.pickerValue}>{prettyDate(startDate)}</Text>
						</TouchableOpacity>
					</View>

					<View style={[styles.fieldGroup, styles.timeCol]}>
						<Text style={styles.label}>End Date</Text>
						<TouchableOpacity
							style={styles.glassInput}
							onPress={() => setShowEndDatePicker(true)}
						>
							<Text style={styles.pickerValue}>{prettyDate(endDate)}</Text>
						</TouchableOpacity>
					</View>
				</View>

				<View style={styles.timeRow}>
					<View style={[styles.fieldGroup, styles.timeCol]}>
						<Text style={styles.label}>Start Time</Text>
						<TouchableOpacity
							style={styles.glassInput}
							onPress={() => setShowStartPicker(true)}
						>
							<Text style={styles.pickerValue}>{prettyTime(startTime)}</Text>
						</TouchableOpacity>
					</View>

					<View style={[styles.fieldGroup, styles.timeCol]}>
						<Text style={styles.label}>End Time</Text>
						<TouchableOpacity
							style={styles.glassInput}
							onPress={() => setShowEndPicker(true)}
						>
							<Text style={styles.pickerValue}>{prettyTime(endTime)}</Text>
						</TouchableOpacity>
					</View>
				</View>

				<DateTimePickerModal
					isVisible={showStartDatePicker}
					mode="date"
					date={startDate}
					minimumDate={new Date()}
					onConfirm={(d) => {
						setShowStartDatePicker(false);
						setStartDate(d);
						if (endDate < d) setEndDate(d);
					}}
					onCancel={() => setShowStartDatePicker(false)}
					display="inline"
				/>

				<DateTimePickerModal
					isVisible={showEndDatePicker}
					mode="date"
					date={endDate}
					minimumDate={startDate}
					onConfirm={(d) => {
						setShowEndDatePicker(false);
						setEndDate(d);
					}}
					onCancel={() => setShowEndDatePicker(false)}
					display="inline"
				/>

				<DateTimePickerModal
					isVisible={showStartPicker}
					mode="time"
					date={startTimeDate}
					onConfirm={(d) => {
						setShowStartPicker(false);
						setStartTime(hhmm(d));
					}}
					onCancel={() => setShowStartPicker(false)}
				/>

				<DateTimePickerModal
					isVisible={showEndPicker}
					mode="time"
					date={endTimeDate}
					onConfirm={(d) => {
						setShowEndPicker(false);
						setEndTime(hhmm(d));
					}}
					onCancel={() => setShowEndPicker(false)}
				/>

				<View style={styles.fieldGroup}>
					<Text style={styles.label}>Address</Text>
					<AddressAutocomplete
						value={addressLine}
						onChangeText={setAddressLine}
						onSelect={(address, c) => {
							setAddressLine(address);
							setCoords(c);
						}}
						inputStyle={styles.glassInput}
						biasCoords={coords}
					/>
				</View>

				<View style={styles.fieldGroup}>
					<Text style={styles.label}>Phone (optional)</Text>
					<TextInput
						style={styles.glassInput}
						value={contactPhone}
						onChangeText={setContactPhone}
						placeholder="(306) 555-1234"
						placeholderTextColor="#807A73"
						keyboardType="phone-pad"
						autoComplete="tel"
						textContentType="telephoneNumber"
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
			</KeyboardAvoidingView>
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
	photosHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 8,
	},
	photosCount: {
		fontSize: 12,
		color: "#807A73",
		fontWeight: "600",
	},
	photosStrip: {
		gap: 10,
		paddingVertical: 4,
	},
	photoTile: {
		width: 80,
		height: 80,
		borderRadius: 12,
		overflow: "hidden",
		position: "relative",
		backgroundColor: "rgba(0,0,0,0.05)",
	},
	photoThumb: {
		width: "100%",
		height: "100%",
	},
	photoRemove: {
		position: "absolute",
		top: 4,
		right: 4,
		width: 20,
		height: 20,
		borderRadius: 10,
		backgroundColor: "rgba(0,0,0,0.6)",
		alignItems: "center",
		justifyContent: "center",
	},
	photoAddTile: {
		width: 80,
		height: 80,
		borderRadius: 12,
		borderWidth: 1.5,
		borderStyle: "dashed",
		borderColor: "rgba(128,122,115,0.4)",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(255,255,255,0.5)",
	},
	photoAddLabel: {
		fontSize: 11,
		color: "#807A73",
		fontWeight: "600",
		marginTop: 2,
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
	pickerValue: {
		fontSize: 15,
		color: "#23201C",
		fontWeight: "600",
	},
	timeRow: {
		flexDirection: "row",
		gap: 12,
	},
	timeCol: {
		flex: 1,
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
