// app/add-sale.tsx
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
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
import { useEffect, useState } from "react";
import {
	Alert,
	Platform,
	ScrollView,
	StyleSheet,
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

	// Media
	const [videoUrl, setVideoUrl] = useState<string | null>(null);
	const [localVideoUri, setLocalVideoUri] = useState<string | null>(null);
	const [photos, setPhotos] = useState<string[]>([]);

	// Form data
	const [form, setForm] = useState({
		title: "",
		description: "",
		address: "",
		categories: [] as string[],
	});

	// Date/Time
	const [startDate, setStartDate] = useState(new Date());
	const [endDate, setEndDate] = useState(new Date());
	const [showStartPicker, setShowStartPicker] = useState(false);
	const [showEndPicker, setShowEndPicker] = useState(false);

	// Contact info
	const [contactName, setContactName] = useState("");
	const [contactPhone, setContactPhone] = useState("");
	const [contactEmail, setContactEmail] = useState("");

	// Location
	const [selectedLocation, setSelectedLocation] = useState<{
		latitude: number;
		longitude: number;
	} | null>(null);

	useEffect(() => {
		// Check if user needs to authenticate
		if (!isAuthenticated) {
			Alert.alert(
				"Authentication Required",
				"Please sign in to create a garage sale listing",
				[
					{ text: "Cancel", onPress: () => router.back() },
					{ text: "Sign In", onPress: () => router.push("/auth/sign-in") },
				]
			);
		}
	}, [isAuthenticated]);

	const handleVideoRecorded = async (
		recordedVideoUri: string,
		frames: string[]
	) => {
		setAnalyzing(true);
		setLocalVideoUri(recordedVideoUri);

		try {
			// Step 1: Get location
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

			// Step 2: Generate thumbnails and analyze with AI
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

			// Step 3: Analyze with Claude
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

			// Step 4: Upload video
			const uploadedVideoUrl = await videoService.uploadVideo(recordedVideoUri);
			setVideoUrl(uploadedVideoUrl);

			// Step 5: Pre-fill form
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
			Alert.alert(
				"✅ Video Analyzed!",
				"Review the auto-filled information below"
			);
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
		// Validation
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
			// Check rate limit
			const rateCheck = await rateLimitService.checkRateLimit();
			if (!rateCheck.allowed) {
				setLoading(false);
				Alert.alert(
					"Posting Limit Reached",
					rateCheck.message || "You have reached the posting limit."
				);
				return;
			}

			// Get location if not already set
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

			// Format dates and times
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

			// Create garage sale
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

	// Step 1: Record Video
	if (currentStep === "record") {
		return (
			<View style={styles.container}>
				<VideoRecorder
					onVideoRecorded={handleVideoRecorded}
					onCancel={() => router.back()}
				/>
				<TouchableOpacity style={styles.skipButton} onPress={handleSkipVideo}>
					<ThemedText style={styles.skipButtonText}>
						Skip Video (Fill Manually)
					</ThemedText>
				</TouchableOpacity>
			</View>
		);
	}

	// Analyzing state
	if (analyzing) {
		return (
			<View style={styles.container}>
				<ThemedView style={styles.analyzingContainer}>
					<ThemedText type="title">🤖 Analyzing Video...</ThemedText>
					<ThemedText style={styles.analyzingText}>
						AI is processing your video
					</ThemedText>
				</ThemedView>
			</View>
		);
	}

	// Step 2: Review
	if (currentStep === "review") {
		return (
			<View style={styles.container}>
				<ThemedView style={styles.header}>
					<ThemedText type="title">Review AI Results</ThemedText>
				</ThemedView>

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

					<View style={styles.aiResultsCard}>
						<ThemedText style={styles.sectionTitle}>✨ AI Generated</ThemedText>

						<View style={styles.resultRow}>
							<ThemedText style={styles.resultLabel}>Title:</ThemedText>
							<ThemedText style={styles.resultText}>{form.title}</ThemedText>
						</View>

						<View style={styles.resultRow}>
							<ThemedText style={styles.resultLabel}>Tags:</ThemedText>
							<View style={styles.tagsContainer}>
								{form.categories.map((cat, idx) => (
									<View key={idx} style={styles.tag}>
										<ThemedText style={styles.tagText}>{cat}</ThemedText>
									</View>
								))}
							</View>
						</View>

						<View style={styles.resultRow}>
							<ThemedText style={styles.resultLabel}>Description:</ThemedText>
							<ThemedText style={styles.resultText}>
								{form.description}
							</ThemedText>
						</View>

						{form.address && (
							<View style={styles.resultRow}>
								<ThemedText style={styles.resultLabel}>Location:</ThemedText>
								<ThemedText style={styles.resultText}>
									{form.address}
								</ThemedText>
							</View>
						)}
					</View>

					<TouchableOpacity
						style={styles.uploadPhotosButton}
						onPress={handleUploadPhotos}
					>
						<ThemedText style={styles.uploadPhotosText}>
							📸 Upload Additional Photos ({photos.length})
						</ThemedText>
					</TouchableOpacity>

					<View style={styles.buttonRow}>
						<TouchableOpacity
							style={[styles.button, styles.secondaryButton]}
							onPress={() => {
								setCurrentStep("record");
								setVideoUrl(null);
								setLocalVideoUri(null);
							}}
						>
							<ThemedText style={styles.secondaryButtonText}>
								Re-record
							</ThemedText>
						</TouchableOpacity>

						<TouchableOpacity
							style={[styles.button, styles.primaryButton]}
							onPress={() => setCurrentStep("publish")}
						>
							<ThemedText style={styles.primaryButtonText}>Continue</ThemedText>
						</TouchableOpacity>
					</View>
				</ScrollView>
			</View>
		);
	}

	// Step 3: Publish
	return (
		<View style={styles.container}>
			<ThemedView style={styles.header}>
				<ThemedText type="title">Publish Sale</ThemedText>
			</ThemedView>

			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
			>
				<View style={styles.section}>
					<ThemedText style={styles.label}>Sale Title *</ThemedText>
					<TextInput
						style={styles.input}
						value={form.title}
						onChangeText={(text) => setForm({ ...form, title: text })}
						placeholder="e.g., Moving Sale"
						placeholderTextColor="#999"
					/>
				</View>

				<View style={styles.section}>
					<ThemedText style={styles.label}>Description *</ThemedText>
					<TextInput
						style={[styles.input, styles.textArea]}
						value={form.description}
						onChangeText={(text) => setForm({ ...form, description: text })}
						placeholder="Describe items for sale..."
						placeholderTextColor="#999"
						multiline
						numberOfLines={4}
					/>
				</View>

				<View style={styles.section}>
					<ThemedText style={styles.label}>Address *</ThemedText>
					<TextInput
						style={styles.input}
						value={form.address}
						onChangeText={(text) => setForm({ ...form, address: text })}
						placeholder="123 Main St, City"
						placeholderTextColor="#999"
					/>
				</View>

				<View style={styles.section}>
					<ThemedText style={styles.label}>Start Date & Time *</ThemedText>
					<TouchableOpacity
						style={styles.dateButton}
						onPress={() => setShowStartPicker(true)}
					>
						<ThemedText>{startDate.toLocaleString()}</ThemedText>
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

				<View style={styles.section}>
					<ThemedText style={styles.label}>End Date & Time *</ThemedText>
					<TouchableOpacity
						style={styles.dateButton}
						onPress={() => setShowEndPicker(true)}
					>
						<ThemedText>{endDate.toLocaleString()}</ThemedText>
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

				<View style={styles.section}>
					<ThemedText style={styles.label}>Your Name *</ThemedText>
					<TextInput
						style={styles.input}
						value={contactName}
						onChangeText={setContactName}
						placeholder="John Doe"
						placeholderTextColor="#999"
					/>
				</View>

				<View style={styles.section}>
					<ThemedText style={styles.label}>Phone Number</ThemedText>
					<TextInput
						style={styles.input}
						value={contactPhone}
						onChangeText={setContactPhone}
						placeholder="306-555-0123"
						placeholderTextColor="#999"
						keyboardType="phone-pad"
					/>
				</View>

				<View style={styles.section}>
					<ThemedText style={styles.label}>Email</ThemedText>
					<TextInput
						style={styles.input}
						value={contactEmail}
						onChangeText={setContactEmail}
						placeholder="your@email.com"
						placeholderTextColor="#999"
						keyboardType="email-address"
						autoCapitalize="none"
					/>
				</View>

				<TouchableOpacity
					style={[
						styles.publishButton,
						loading && styles.publishButtonDisabled,
					]}
					onPress={handlePublish}
					disabled={loading}
				>
					<ThemedText style={styles.publishButtonText}>
						{loading ? "Publishing..." : "🚀 Publish Sale"}
					</ThemedText>
				</TouchableOpacity>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		padding: 20,
		paddingTop: 60,
		borderBottomWidth: 1,
		borderBottomColor: "#e0e0e0",
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		padding: 20,
		paddingBottom: 40,
	},
	analyzingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 40,
	},
	analyzingText: {
		fontSize: 16,
		marginTop: 10,
		opacity: 0.7,
	},
	videoPreview: {
		width: "100%",
		height: 200,
		borderRadius: 12,
		marginBottom: 20,
	},
	aiResultsCard: {
		backgroundColor: "#E3F2FD",
		padding: 16,
		borderRadius: 12,
		marginBottom: 20,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 12,
	},
	resultRow: {
		marginBottom: 12,
	},
	resultLabel: {
		fontSize: 12,
		textTransform: "uppercase",
		opacity: 0.6,
		marginBottom: 4,
		fontWeight: "600",
	},
	resultText: {
		fontSize: 15,
	},
	tagsContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 6,
		marginTop: 4,
	},
	tag: {
		backgroundColor: "#1976D2",
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 12,
	},
	tagText: {
		color: "#fff",
		fontSize: 12,
		fontWeight: "500",
	},
	uploadPhotosButton: {
		backgroundColor: "#FF9500",
		padding: 16,
		borderRadius: 12,
		alignItems: "center",
		marginBottom: 20,
	},
	uploadPhotosText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "bold",
	},
	buttonRow: {
		flexDirection: "row",
		gap: 12,
		marginBottom: 20,
	},
	button: {
		flex: 1,
		padding: 16,
		borderRadius: 12,
		alignItems: "center",
	},
	primaryButton: {
		backgroundColor: "#0066FF",
	},
	primaryButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "bold",
	},
	secondaryButton: {
		backgroundColor: "#f0f0f0",
	},
	secondaryButtonText: {
		color: "#333",
		fontSize: 16,
		fontWeight: "bold",
	},
	section: {
		marginBottom: 20,
	},
	label: {
		fontSize: 16,
		fontWeight: "bold",
		marginBottom: 8,
	},
	input: {
		backgroundColor: "white",
		borderWidth: 1,
		borderColor: "#ddd",
		borderRadius: 8,
		padding: 12,
		fontSize: 16,
	},
	textArea: {
		height: 100,
		textAlignVertical: "top",
	},
	dateButton: {
		backgroundColor: "white",
		borderWidth: 1,
		borderColor: "#ddd",
		borderRadius: 8,
		padding: 12,
	},
	publishButton: {
		backgroundColor: "#34C759",
		padding: 18,
		borderRadius: 12,
		alignItems: "center",
		marginTop: 20,
	},
	publishButtonDisabled: {
		opacity: 0.6,
	},
	publishButtonText: {
		color: "#fff",
		fontSize: 18,
		fontWeight: "bold",
	},
	skipButton: {
		position: "absolute",
		bottom: 100,
		left: 20,
		right: 20,
		backgroundColor: "rgba(0, 0, 0, 0.7)",
		padding: 16,
		borderRadius: 12,
		alignItems: "center",
	},
	skipButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "600",
	},
});
