// app/add-sale.tsx
import VideoRecorder from "@/components/VideoRecorder";
import { useAuth } from "@/contexts/AuthContext";
import { analyzeGarageSaleVideo } from "@/lib/claude";
import { garageSaleService } from "@/services/garageSaleService";
import { rateLimitService } from "@/services/rateLimitService";
import { videoService } from "@/services/videoService";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ResizeMode, Video } from "expo-av";
import { EncodingType, readAsStringAsync } from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { router } from "expo-router";
import * as VideoThumbnails from "expo-video-thumbnails";
import { useState } from "react";
import {
	Alert,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

type Step = "record" | "review" | "publish";

export default function AddSaleScreen() {
	const { user, isAuthenticated } = useAuth();
	const [currentStep, setCurrentStep] = useState<Step>("record");
	const [loading, setLoading] = useState(false);
	const [analyzing, setAnalyzing] = useState(false);

	const [videoUrl, setVideoUrl] = useState<string | null>(null);
	const [localVideoUri, setLocalVideoUri] = useState<string | null>(null);
	const [photos, setPhotos] = useState<string[]>([]);

	const [form, setForm] = useState({
		title: "",
		description: "",
		address: "",
		categories: [] as string[],
	});

	const [startDate, setStartDate] = useState(new Date());
	const [endDate, setEndDate] = useState(new Date());
	const [showStartPicker, setShowStartPicker] = useState(false);
	const [showEndPicker, setShowEndPicker] = useState(false);

	const [contactName, setContactName] = useState("");
	const [contactPhone, setContactPhone] = useState("");
	const [contactEmail, setContactEmail] = useState("");

	const [selectedLocation, setSelectedLocation] = useState<{
		latitude: number;
		longitude: number;
	} | null>(null);

	// useEffect(() => {
	// 	if (!isAuthenticated) {
	// 		Alert.alert(
	// 			"Sign in Required",
	// 			"Please sign in to create a garage sale listing",
	// 			[
	// 				{ text: "Cancel", onPress: () => router.back() },
	// 				{
	// 					text: "Sign In",
	// 					onPress: () => router.push("/auth/sign-in" as any),
	// 				},
	// 			]
	// 		);
	// 	}
	// }, [isAuthenticated]);

	const handleVideoRecorded = async (
		recordedVideoUri: string,
		frames: string[]
	) => {
		setAnalyzing(true);
		setLocalVideoUri(recordedVideoUri);

		try {
			let address = "";
			let currentLocation: { latitude: number; longitude: number } | null =
				null;

			try {
				const { status } = await Location.requestForegroundPermissionsAsync();
				if (status === "granted") {
					const location = await Location.getCurrentPositionAsync({});
					currentLocation = {
						latitude: location.coords.latitude,
						longitude: location.coords.longitude,
					};

					const reverseGeocode = await Location.reverseGeocodeAsync({
						latitude: location.coords.latitude,
						longitude: location.coords.longitude,
					});

					if (reverseGeocode.length > 0) {
						const addr = reverseGeocode[0];
						const parts = [];
						if (addr.streetNumber) parts.push(addr.streetNumber);
						if (addr.street) parts.push(addr.street);
						const streetAddress = parts.join(" ");
						const cityState = [addr.city, addr.region]
							.filter(Boolean)
							.join(", ");

						if (streetAddress && cityState) {
							address = `${streetAddress}, ${cityState}`;
						} else if (cityState) {
							address = cityState;
						}
					}
				}
			} catch (locationError) {
				console.error("Location error:", locationError);
			}

			const thumbnailPromises = [0, 2500, 4500].map((time) =>
				VideoThumbnails.getThumbnailAsync(recordedVideoUri, { time })
			);
			const thumbnails = await Promise.all(thumbnailPromises);

			const base64Frames = await Promise.all(
				thumbnails.map(async (thumbnail) => {
					const base64 = await readAsStringAsync(thumbnail.uri, {
						encoding: EncodingType.Base64,
					});
					return base64;
				})
			);

			let analysis;
			try {
				analysis = await analyzeGarageSaleVideo(base64Frames);
			} catch (aiError) {
				console.error("AI analysis failed:", aiError);
				analysis = {
					title: "Garage Sale",
					description: "Various items for sale",
					categories: ["other"],
				};
			}

			const uploadedVideoUrl = await videoService.uploadVideo(recordedVideoUri);
			setVideoUrl(uploadedVideoUrl);

			setForm({
				title: analysis.title,
				description: analysis.description,
				address: address,
				categories: analysis.categories,
			});

			if (currentLocation) {
				setSelectedLocation(currentLocation);
			}

			setCurrentStep("review");
		} catch (error: any) {
			console.error("Error processing video:", error);
			Alert.alert("Error", "Failed to analyze video. Please try again.");
			setCurrentStep("record");
		} finally {
			setAnalyzing(false);
		}
	};

	const handleSkipVideo = () => {
		setCurrentStep("publish");
	};

	const handleUploadPhotos = async () => {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsMultipleSelection: true,
			quality: 0.8,
		});

		if (!result.canceled) {
			setPhotos([...photos, ...result.assets.map((asset) => asset.uri)]);
		}
	};

	const handlePublish = async () => {
		if (!form.title.trim()) {
			Alert.alert("Error", "Please enter a title");
			return;
		}
		if (!form.description.trim()) {
			Alert.alert("Error", "Please enter a description");
			return;
		}
		if (!form.address.trim()) {
			Alert.alert("Error", "Please enter an address");
			return;
		}
		if (!contactName.trim()) {
			Alert.alert("Error", "Please enter your name");
			return;
		}

		setLoading(true);

		try {
			const rateCheck = await rateLimitService.checkRateLimit();
			if (!rateCheck.allowed) {
				setLoading(false);
				Alert.alert(
					"Posting Limit Reached",
					rateCheck.message || "You have reached the posting limit."
				);
				return;
			}

			let latitude = selectedLocation?.latitude || 52.1332;
			let longitude = selectedLocation?.longitude || -106.67;

			if (!selectedLocation) {
				try {
					const { status } = await Location.requestForegroundPermissionsAsync();
					if (status === "granted") {
						const location = await Location.getCurrentPositionAsync({});
						latitude = location.coords.latitude;
						longitude = location.coords.longitude;
					}
				} catch (error) {
					console.log("Could not get location, using default");
				}
			}

			const formatDate = (date: Date) => {
				const year = date.getFullYear();
				const month = String(date.getMonth() + 1).padStart(2, "0");
				const day = String(date.getDate()).padStart(2, "0");
				return `${year}-${month}-${day}`;
			};

			const formatTime = (date: Date) => {
				const hours = String(date.getHours()).padStart(2, "0");
				const minutes = String(date.getMinutes()).padStart(2, "0");
				return `${hours}:${minutes}`;
			};

			const deviceId = await rateLimitService.getDeviceId();

			await garageSaleService.addGarageSale(
				{
					title: form.title,
					description: form.description,
					location: {
						latitude,
						longitude,
						address: form.address,
					},
					date: formatDate(startDate),
					startDate: formatDate(startDate),
					endDate: formatDate(endDate),
					startTime: formatTime(startDate),
					endTime: formatTime(endDate),
					categories: form.categories,
					contactName: contactName,
					contactPhone: contactPhone || undefined,
					contactEmail: contactEmail || undefined,
					videoUrl: videoUrl || undefined,
					images: photos.length > 0 ? photos : undefined,
					isActive: true,
				},
				deviceId,
				user?.id
			);

			Alert.alert("Success", "Your garage sale has been posted!", [
				{ text: "OK", onPress: () => router.back() },
			]);
		} catch (error: any) {
			console.error("Error creating garage sale:", error);
			Alert.alert("Error", "Failed to post garage sale. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	if (currentStep === "record") {
		return (
			<View style={styles.container}>
				<VideoRecorder
					onVideoRecorded={handleVideoRecorded}
					onCancel={() => router.back()}
				/>
				<View style={styles.recordOverlay}>
					<View style={styles.recordCard}>
						<Text style={styles.recordTitle}>Record a 5-second video</Text>
						<Text style={styles.recordSubtitle}>
							AI will auto-fill your listing details
						</Text>
					</View>
					<TouchableOpacity
						style={styles.skipVideoButton}
						onPress={handleSkipVideo}
					>
						<Text style={styles.skipVideoText}>Skip Video (Fill Manually)</Text>
					</TouchableOpacity>
				</View>
			</View>
		);
	}

	if (analyzing) {
		return (
			<View style={styles.container}>
				<View style={styles.analyzingContainer}>
					<Text style={styles.analyzingTitle}>🤖 Analyzing Video...</Text>
					<Text style={styles.analyzingText}>AI is processing your video</Text>
				</View>
			</View>
		);
	}

	if (currentStep === "review") {
		return (
			<View style={styles.container}>
				<View style={styles.header}>
					<TouchableOpacity
						onPress={() => router.back()}
						style={styles.backButton}
					>
						<Text style={styles.backText}>✕</Text>
					</TouchableOpacity>
					<Text style={styles.headerTitle}>Review AI Results</Text>
					<View style={styles.placeholder} />
				</View>

				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
				>
					{localVideoUri && (
						<Video
							source={{ uri: localVideoUri }}
							style={styles.videoPreview}
							resizeMode={ResizeMode.COVER}
							useNativeControls
							isLooping
						/>
					)}

					<View style={styles.aiCard}>
						<Text style={styles.aiTitle}>✨ AI Generated</Text>

						<View style={styles.aiRow}>
							<Text style={styles.aiLabel}>Title</Text>
							<Text style={styles.aiValue}>{form.title}</Text>
						</View>

						<View style={styles.aiRow}>
							<Text style={styles.aiLabel}>Tags</Text>
							<View style={styles.tagsContainer}>
								{form.categories.map((cat, idx) => (
									<View key={idx} style={styles.tag}>
										<Text style={styles.tagText}>{cat}</Text>
									</View>
								))}
							</View>
						</View>

						<View style={styles.aiRow}>
							<Text style={styles.aiLabel}>Description</Text>
							<Text style={styles.aiValue}>{form.description}</Text>
						</View>

						{form.address && (
							<View style={styles.aiRow}>
								<Text style={styles.aiLabel}>Location</Text>
								<Text style={styles.aiValue}>{form.address}</Text>
							</View>
						)}
					</View>

					<TouchableOpacity
						style={styles.uploadButton}
						onPress={handleUploadPhotos}
					>
						<Text style={styles.uploadIcon}>📸</Text>
						<Text style={styles.uploadText}>
							Upload Additional Photos ({photos.length})
						</Text>
					</TouchableOpacity>

					<View style={styles.buttonRow}>
						<TouchableOpacity
							style={styles.secondaryButton}
							onPress={() => {
								setCurrentStep("record");
								setVideoUrl(null);
								setLocalVideoUri(null);
							}}
						>
							<Text style={styles.secondaryButtonText}>Re-record</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={styles.primaryButton}
							onPress={() => setCurrentStep("publish")}
						>
							<Text style={styles.primaryButtonText}>Continue</Text>
						</TouchableOpacity>
					</View>
				</ScrollView>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<TouchableOpacity
					onPress={() => router.back()}
					style={styles.backButton}
				>
					<Text style={styles.backText}>✕</Text>
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Publish Sale</Text>
				<View style={styles.placeholder} />
			</View>

			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
			>
				<View style={styles.formCard}>
					<View style={styles.inputGroup}>
						<Text style={styles.inputLabel}>Sale Title *</Text>
						<TextInput
							style={styles.input}
							value={form.title}
							onChangeText={(text) => setForm({ ...form, title: text })}
							placeholder="e.g., Moving Sale"
							placeholderTextColor="#666"
						/>
					</View>

					<View style={styles.inputGroup}>
						<Text style={styles.inputLabel}>Description *</Text>
						<TextInput
							style={[styles.input, styles.textArea]}
							value={form.description}
							onChangeText={(text) => setForm({ ...form, description: text })}
							placeholder="Describe items for sale..."
							placeholderTextColor="#666"
							multiline
							numberOfLines={4}
						/>
					</View>

					<View style={styles.inputGroup}>
						<Text style={styles.inputLabel}>Address *</Text>
						<TextInput
							style={styles.input}
							value={form.address}
							onChangeText={(text) => setForm({ ...form, address: text })}
							placeholder="123 Main St, City"
							placeholderTextColor="#666"
						/>
					</View>

					<View style={styles.inputGroup}>
						<Text style={styles.inputLabel}>Start Date & Time *</Text>
						<TouchableOpacity
							style={styles.dateInput}
							onPress={() => setShowStartPicker(true)}
						>
							<Text style={styles.dateText}>{startDate.toLocaleString()}</Text>
						</TouchableOpacity>
						{showStartPicker && (
							<DateTimePicker
								value={startDate}
								mode="datetime"
								display="default"
								onChange={(event, date) => {
									setShowStartPicker(Platform.OS === "ios");
									if (date) setStartDate(date);
								}}
							/>
						)}
					</View>

					<View style={styles.inputGroup}>
						<Text style={styles.inputLabel}>End Date & Time *</Text>
						<TouchableOpacity
							style={styles.dateInput}
							onPress={() => setShowEndPicker(true)}
						>
							<Text style={styles.dateText}>{endDate.toLocaleString()}</Text>
						</TouchableOpacity>
						{showEndPicker && (
							<DateTimePicker
								value={endDate}
								mode="datetime"
								display="default"
								onChange={(event, date) => {
									setShowEndPicker(Platform.OS === "ios");
									if (date) setEndDate(date);
								}}
							/>
						)}
					</View>

					<View style={styles.inputGroup}>
						<Text style={styles.inputLabel}>Your Name *</Text>
						<TextInput
							style={styles.input}
							value={contactName}
							onChangeText={setContactName}
							placeholder="John Doe"
							placeholderTextColor="#666"
						/>
					</View>

					<View style={styles.inputGroup}>
						<Text style={styles.inputLabel}>Phone Number</Text>
						<TextInput
							style={styles.input}
							value={contactPhone}
							onChangeText={setContactPhone}
							placeholder="306-555-0123"
							placeholderTextColor="#666"
							keyboardType="phone-pad"
						/>
					</View>

					<View style={styles.inputGroup}>
						<Text style={styles.inputLabel}>Email</Text>
						<TextInput
							style={styles.input}
							value={contactEmail}
							onChangeText={setContactEmail}
							placeholder="your@email.com"
							placeholderTextColor="#666"
							keyboardType="email-address"
							autoCapitalize="none"
						/>
					</View>
				</View>

				<TouchableOpacity
					style={[
						styles.publishButton,
						loading && styles.publishButtonDisabled,
					]}
					onPress={handlePublish}
					disabled={loading}
				>
					<Text style={styles.publishIcon}>🚀</Text>
					<Text style={styles.publishButtonText}>
						{loading ? "Publishing..." : "Publish Sale"}
					</Text>
				</TouchableOpacity>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#0A0A0A",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 20,
		paddingTop: 60,
		paddingBottom: 20,
		backgroundColor: "#0A0A0A",
	},
	backButton: {
		width: 40,
		height: 40,
		justifyContent: "center",
		alignItems: "center",
	},
	backText: {
		fontSize: 24,
		color: "#FFF",
	},
	headerTitle: {
		fontSize: 20,
		fontWeight: "bold",
		color: "#FFF",
	},
	placeholder: {
		width: 40,
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		padding: 20,
		paddingBottom: 40,
	},
	recordOverlay: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		justifyContent: "space-between",
		paddingTop: 80,
		paddingBottom: 40,
		paddingHorizontal: 20,
	},
	recordCard: {
		backgroundColor: "rgba(0, 0, 0, 0.85)",
		padding: 20,
		borderRadius: 16,
		alignItems: "center",
	},
	recordTitle: {
		fontSize: 20,
		fontWeight: "bold",
		color: "#FFF",
		marginBottom: 8,
	},
	recordSubtitle: {
		fontSize: 14,
		color: "#999",
		textAlign: "center",
	},
	skipVideoButton: {
		backgroundColor: "rgba(255, 255, 255, 0.15)",
		paddingVertical: 16,
		paddingHorizontal: 24,
		borderRadius: 12,
		alignItems: "center",
	},
	skipVideoText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#FFF",
	},
	analyzingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 40,
	},
	analyzingTitle: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#FFF",
		marginBottom: 12,
	},
	analyzingText: {
		fontSize: 16,
		color: "#999",
	},
	videoPreview: {
		width: "100%",
		height: 200,
		borderRadius: 16,
		marginBottom: 20,
		backgroundColor: "#1A1A1A",
	},
	aiCard: {
		backgroundColor: "#1A1A1A",
		padding: 20,
		borderRadius: 16,
		marginBottom: 20,
	},
	aiTitle: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#FFF",
		marginBottom: 16,
	},
	aiRow: {
		marginBottom: 16,
	},
	aiLabel: {
		fontSize: 12,
		fontWeight: "600",
		color: "#999",
		textTransform: "uppercase",
		marginBottom: 8,
	},
	aiValue: {
		fontSize: 15,
		color: "#FFF",
	},
	tagsContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	tag: {
		backgroundColor: "#007AFF",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 12,
	},
	tagText: {
		fontSize: 13,
		color: "#FFF",
		fontWeight: "500",
	},
	uploadButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#FF8C42",
		paddingVertical: 16,
		borderRadius: 12,
		marginBottom: 20,
		gap: 8,
	},
	uploadIcon: {
		fontSize: 20,
	},
	uploadText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#FFF",
	},
	buttonRow: {
		flexDirection: "row",
		gap: 12,
	},
	primaryButton: {
		flex: 1,
		backgroundColor: "#007AFF",
		paddingVertical: 16,
		borderRadius: 12,
		alignItems: "center",
	},
	primaryButtonText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#FFF",
	},
	secondaryButton: {
		flex: 1,
		backgroundColor: "#2A2A2A",
		paddingVertical: 16,
		borderRadius: 12,
		alignItems: "center",
	},
	secondaryButtonText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#FFF",
	},
	formCard: {
		backgroundColor: "#1A1A1A",
		padding: 20,
		borderRadius: 16,
		marginBottom: 20,
	},
	inputGroup: {
		marginBottom: 20,
	},
	inputLabel: {
		fontSize: 14,
		fontWeight: "600",
		color: "#FFF",
		marginBottom: 8,
	},
	input: {
		backgroundColor: "#2A2A2A",
		borderWidth: 1,
		borderColor: "#3A3A3A",
		borderRadius: 12,
		padding: 14,
		fontSize: 16,
		color: "#FFF",
	},
	textArea: {
		height: 100,
		textAlignVertical: "top",
	},
	dateInput: {
		backgroundColor: "#2A2A2A",
		borderWidth: 1,
		borderColor: "#3A3A3A",
		borderRadius: 12,
		padding: 14,
	},
	dateText: {
		fontSize: 16,
		color: "#FFF",
	},
	publishButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#34C759",
		paddingVertical: 18,
		borderRadius: 12,
		gap: 8,
	},
	publishButtonDisabled: {
		opacity: 0.6,
	},
	publishIcon: {
		fontSize: 20,
	},
	publishButtonText: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#FFF",
	},
});
