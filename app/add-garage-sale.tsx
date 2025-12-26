import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import VideoRecorder from "@/components/VideoRecorder";
import { useAuth } from "@/contexts/AuthContext";
import { analyzeGarageSaleVideo } from "@/lib/claude";
import { garageSaleService } from "@/services/garageSaleService";
import { rateLimitService } from "@/services/rateLimitService";
import { videoService } from "@/services/videoService";
import DateTimePicker from "@react-native-community/datetimepicker";
import { EncodingType, readAsStringAsync } from "expo-file-system/legacy";
import * as Location from "expo-location";
import { router } from "expo-router";
import * as VideoThumbnails from "expo-video-thumbnails";
import { useRef, useState } from "react";
import {
	Alert,
	Platform,
	ScrollView,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
// import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
// import { GOOGLE_MAPS_API_KEY } from '@/constants/config';

export default function AddGarageSaleScreen() {
	const { user } = useAuth();
	const [loading, setLoading] = useState(false);
	const [showCamera, setShowCamera] = useState(true); // Start with camera, but allow skip
	const [analyzing, setAnalyzing] = useState(false);
	const [videoUrl, setVideoUrl] = useState<string | null>(null);
	const [showStartDatePicker, setShowStartDatePicker] = useState(false);
	const [showStartTimePicker, setShowStartTimePicker] = useState(false);
	const [showEndDatePicker, setShowEndDatePicker] = useState(false);
	const [showEndTimePicker, setShowEndTimePicker] = useState(false);
	const [startDate, setStartDate] = useState(new Date());
	const [endDate, setEndDate] = useState(new Date());
	const [form, setForm] = useState({
		title: "",
		description: "",
		address: "",
		startDateTime: "",
		endDateTime: "",
		contactName: "",
		contactPhone: "",
		contactEmail: "",
		selectedCategories: [] as string[],
	});
	const [selectedLocation, setSelectedLocation] = useState<{
		latitude: number;
		longitude: number;
	} | null>(null);
	const [addressSuggestions, setAddressSuggestions] = useState<
		Array<{
			address: string;
			latitude: number;
			longitude: number;
		}>
	>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Debounced address search
	const searchAddress = async (text: string) => {
		if (text.length >= 3) {
			try {
				// Try to geocode the partial address
				const results = await Location.geocodeAsync(
					text + ", Saskatchewan, Canada"
				);

				if (results.length > 0) {
					// Convert coordinates back to full addresses
					const suggestions = await Promise.all(
						results.slice(0, 5).map(async (result) => {
							try {
								const reverseGeocode = await Location.reverseGeocodeAsync({
									latitude: result.latitude,
									longitude: result.longitude,
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

									let fullAddress = "";
									if (streetAddress && cityState) {
										fullAddress = `${streetAddress}, ${cityState}`;
									} else if (cityState) {
										fullAddress = cityState;
									} else if (streetAddress) {
										fullAddress = streetAddress;
									}

									return {
										address: fullAddress,
										latitude: result.latitude,
										longitude: result.longitude,
									};
								}
							} catch (error) {
								console.log("Error reverse geocoding:", error);
							}
							return null;
						})
					);

					const validSuggestions = suggestions.filter(
						(s) => s !== null
					) as Array<{
						address: string;
						latitude: number;
						longitude: number;
					}>;

					setAddressSuggestions(validSuggestions);
					setShowSuggestions(validSuggestions.length > 0);
				} else {
					setAddressSuggestions([]);
					setShowSuggestions(false);
				}
			} catch (error) {
				console.log("Error geocoding:", error);
				setAddressSuggestions([]);
				setShowSuggestions(false);
			}
		} else {
			setAddressSuggestions([]);
			setShowSuggestions(false);
		}
	};

	const handleVideoRecorded = async (
		recordedVideoUri: string,
		frames: string[]
	) => {
		setShowCamera(false);
		setAnalyzing(true);

		try {
			console.log("Video recorded:", recordedVideoUri);

			// Step 1: Get current location and reverse geocode to address
			let address = "";
			let currentLocation: { latitude: number; longitude: number } | null =
				null;

			try {
				const { status } = await Location.requestForegroundPermissionsAsync();
				if (status === "granted") {
					const location = await Location.getCurrentPositionAsync({});
					console.log("Got location:", location.coords);

					// Save location for later use
					currentLocation = {
						latitude: location.coords.latitude,
						longitude: location.coords.longitude,
					};

					const reverseGeocode = await Location.reverseGeocodeAsync({
						latitude: location.coords.latitude,
						longitude: location.coords.longitude,
					});

					console.log("Reverse geocode result:", reverseGeocode);

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
						} else if (streetAddress) {
							address = streetAddress;
						}

						console.log("Formatted address:", address);
					}
				}
			} catch (locationError) {
				console.error("Could not get address:", locationError);
			}

			// Step 2: Generate thumbnails from video
			const thumbnailPromises = [0, 2500, 4500].map((time) =>
				VideoThumbnails.getThumbnailAsync(recordedVideoUri, { time })
			);
			const thumbnails = await Promise.all(thumbnailPromises);

			// Step 3: Convert thumbnails to base64
			const base64Frames = await Promise.all(
				thumbnails.map(async (thumbnail) => {
					const base64 = await readAsStringAsync(thumbnail.uri, {
						encoding: EncodingType.Base64,
					});
					return base64;
				})
			);

			// Step 4: Analyze with Claude AI
			let analysis;
			try {
				analysis = await analyzeGarageSaleVideo(base64Frames);
				console.log("AI Analysis:", analysis);
			} catch (aiError) {
				console.error("AI analysis failed:", aiError);
				// Use default values if AI fails
				analysis = {
					title: "Garage Sale",
					description: "Various items for sale",
					categories: ["other"],
				};
			}

			// Step 5: Upload video to Supabase
			const uploadedVideoUrl = await videoService.uploadVideo(recordedVideoUri);
			setVideoUrl(uploadedVideoUrl);

			// Step 6: Auto-fill form with AI results and location
			setForm({
				...form,
				title: analysis.title,
				description: analysis.description,
				address: address,
				selectedCategories: analysis.categories,
			});

			// Save the location coordinates from device
			if (currentLocation) {
				setSelectedLocation(currentLocation);
			}

			Alert.alert(
				"✅ Video Analyzed!",
				"Form has been auto-filled with AI-generated content and your location. Please review and complete the remaining fields.",
				[{ text: "OK" }]
			);
		} catch (error: any) {
			console.error("Error processing video:", error);
			Alert.alert(
				"Error",
				"Failed to analyze video. You can still fill the form manually.",
				[{ text: "OK" }]
			);
		} finally {
			setAnalyzing(false);
		}
	};

	const formatDateTime = (date: Date): string => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		const hours = String(date.getHours()).padStart(2, "0");
		const minutes = String(date.getMinutes()).padStart(2, "0");
		return `${year}-${month}-${day} ${hours}:${minutes}`;
	};

	const handleStartDateChange = (event: any, selectedDate?: Date) => {
		setShowStartDatePicker(Platform.OS === "ios");
		if (selectedDate) {
			setStartDate(selectedDate);
			setForm({ ...form, startDateTime: formatDateTime(selectedDate) });
		}
	};

	const handleStartTimeChange = (event: any, selectedDate?: Date) => {
		setShowStartTimePicker(Platform.OS === "ios");
		if (selectedDate) {
			setStartDate(selectedDate);
			setForm({ ...form, startDateTime: formatDateTime(selectedDate) });
		}
	};

	const handleEndDateChange = (event: any, selectedDate?: Date) => {
		setShowEndDatePicker(Platform.OS === "ios");
		if (selectedDate) {
			setEndDate(selectedDate);
			setForm({ ...form, endDateTime: formatDateTime(selectedDate) });
		}
	};

	const handleEndTimeChange = (event: any, selectedDate?: Date) => {
		setShowEndTimePicker(Platform.OS === "ios");
		if (selectedDate) {
			setEndDate(selectedDate);
			setForm({ ...form, endDateTime: formatDateTime(selectedDate) });
		}
	};

	const handleAddressChange = (text: string) => {
		setForm({ ...form, address: text });

		// Clear location when manually editing
		if (selectedLocation && text !== form.address) {
			setSelectedLocation(null);
		}

		// Clear previous timeout
		if (searchTimeoutRef.current) {
			clearTimeout(searchTimeoutRef.current);
		}

		// Debounce the search
		searchTimeoutRef.current = setTimeout(() => {
			searchAddress(text);
		}, 500); // Wait 500ms after user stops typing
	};

	const selectSuggestion = (suggestion: {
		address: string;
		latitude: number;
		longitude: number;
	}) => {
		setForm({ ...form, address: suggestion.address });
		setSelectedLocation({
			latitude: suggestion.latitude,
			longitude: suggestion.longitude,
		});
		setShowSuggestions(false);
		setAddressSuggestions([]);
	};

	const handleUseCurrentLocation = async () => {
		try {
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== "granted") {
				Alert.alert(
					"Permission Denied",
					"Please enable location permissions to use this feature."
				);
				return;
			}

			const location = await Location.getCurrentPositionAsync({});
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
				const cityState = [addr.city, addr.region].filter(Boolean).join(", ");

				let address = "";
				if (streetAddress && cityState) {
					address = `${streetAddress}, ${cityState}`;
				} else if (cityState) {
					address = cityState;
				} else if (streetAddress) {
					address = streetAddress;
				}

				setForm({ ...form, address });
				setSelectedLocation({
					latitude: location.coords.latitude,
					longitude: location.coords.longitude,
				});

				Alert.alert("Success", "Using your current location");
			}
		} catch (error) {
			console.error("Error getting current location:", error);
			Alert.alert("Error", "Failed to get current location. Please try again.");
		}
	};

	const handleSubmit = async () => {
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
		if (!form.startDateTime) {
			Alert.alert(
				"Error",
				"Please enter start date and time (YYYY-MM-DD HH:MM)"
			);
			return;
		}
		if (!form.endDateTime) {
			Alert.alert("Error", "Please enter end date and time (YYYY-MM-DD HH:MM)");
			return;
		}
		if (!form.contactName.trim()) {
			Alert.alert("Error", "Please enter your name");
			return;
		}

		setLoading(true);

		try {
			// Check rate limit before posting
			const rateCheck = await rateLimitService.checkRateLimit();
			if (!rateCheck.allowed) {
				setLoading(false);
				Alert.alert(
					"Posting Limit Reached",
					rateCheck.message || "You have reached the posting limit."
				);
				return;
			}
			// Parse datetime strings
			const startParts = form.startDateTime.split(" ");
			const endParts = form.endDateTime.split(" ");

			if (startParts.length !== 2 || endParts.length !== 2) {
				Alert.alert("Error", "Invalid date/time format. Use YYYY-MM-DD HH:MM");
				setLoading(false);
				return;
			}

			const startDate = startParts[0];
			const startTime = startParts[1];
			const endDate = endParts[0];
			const endTime = endParts[1];

			// Use selected location from autocomplete, or try to geocode the address
			let latitude = selectedLocation?.latitude || 52.1332; // Default Saskatoon
			let longitude = selectedLocation?.longitude || -106.67;

			// If no location selected, try to geocode the address
			if (!selectedLocation) {
				try {
					const geocoded = await Location.geocodeAsync(form.address);
					if (geocoded.length > 0) {
						latitude = geocoded[0].latitude;
						longitude = geocoded[0].longitude;
					} else {
						// Fallback to current location if geocoding fails
						try {
							const { status } =
								await Location.requestForegroundPermissionsAsync();
							if (status === "granted") {
								const location = await Location.getCurrentPositionAsync({});
								latitude = location.coords.latitude;
								longitude = location.coords.longitude;
							}
						} catch (error) {
							console.log("Could not get location, using default");
						}
					}
				} catch (error) {
					console.log("Could not geocode address, trying current location");
					try {
						const { status } =
							await Location.requestForegroundPermissionsAsync();
						if (status === "granted") {
							const location = await Location.getCurrentPositionAsync({});
							latitude = location.coords.latitude;
							longitude = location.coords.longitude;
						}
					} catch (error) {
						console.log("Could not get location, using default");
					}
				}
			}

			// Get device ID for tracking (optional - only works if migration was run)
			let deviceId: string | undefined;
			try {
				deviceId = await rateLimitService.getDeviceId();
			} catch (error) {
				console.log("Device ID not available, posting without rate limiting");
				// Continue without device ID if it fails
			}

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
					date: startDate,
					startTime: startTime,
					endTime: endTime,
					categories: form.selectedCategories,
					contactName: form.contactName,
					contactPhone: form.contactPhone || undefined,
					contactEmail: form.contactEmail || undefined,
					videoUrl: videoUrl || undefined,
					isActive: true,
				},
				deviceId,
				user?.id
			);

			Alert.alert("Success", "Your garage sale has been posted!", [
				{
					text: "OK",
					onPress: () => router.back(),
				},
			]);
		} catch (error: any) {
			console.error("Error creating garage sale:", error);
			Alert.alert("Error", "Failed to post garage sale. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	// Show camera when user wants to add video
	if (showCamera) {
		return (
			<VideoRecorder
				onVideoRecorded={handleVideoRecorded}
				onCancel={() => setShowCamera(false)}
			/>
		);
	}

	// Show analyzing state
	if (analyzing) {
		return (
			<View style={styles.container}>
				<ThemedView style={styles.analyzingContainer}>
					<ThemedText type="title">🤖 Analyzing Video...</ThemedText>
					<ThemedText style={styles.analyzingSubtext}>
						AI is processing your video and auto-filling the form
					</ThemedText>
					<View style={styles.stepsContainer}>
						<ThemedText style={styles.step}>✓ Video recorded</ThemedText>
						<ThemedText style={styles.step}>
							⏳ Getting your location...
						</ThemedText>
						<ThemedText style={styles.step}>⏳ Extracting frames...</ThemedText>
						<ThemedText style={styles.step}>⏳ Analyzing with AI...</ThemedText>
						<ThemedText style={styles.step}>⏳ Uploading video...</ThemedText>
					</View>
				</ThemedView>
			</View>
		);
	}

	// Show form after video is processed
	return (
		<View style={styles.container}>
			<ThemedView style={styles.header}>
				<TouchableOpacity
					onPress={() => router.back()}
					style={styles.backButton}
				>
					<ThemedText style={styles.backButtonText}>✕</ThemedText>
				</TouchableOpacity>
				<ThemedText type="title">Add Garage Sale</ThemedText>
			</ThemedView>

			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
			>
				{videoUrl && (
					<View style={styles.aiNotice}>
						<ThemedText style={styles.aiNoticeText}>
							✨ Title, description, and address were auto-filled by AI. Please
							review and complete the remaining fields.
						</ThemedText>
					</View>
				)}

				<View style={styles.section}>
					<ThemedText style={styles.label}>Title *</ThemedText>
					<TextInput
						style={styles.input}
						value={form.title}
						onChangeText={(text) => setForm({ ...form, title: text })}
						placeholder="e.g., Huge Multi-Family Garage Sale"
						placeholderTextColor="#999"
					/>
				</View>

				<View style={styles.section}>
					<ThemedText style={styles.label}>Description *</ThemedText>
					<TextInput
						style={[styles.input, styles.textArea]}
						value={form.description}
						onChangeText={(text) => setForm({ ...form, description: text })}
						placeholder="Describe what you're selling..."
						placeholderTextColor="#999"
						multiline
						numberOfLines={4}
					/>
				</View>

				<View style={styles.section}>
					<ThemedText style={styles.label}>Address *</ThemedText>
					<View style={styles.addressContainer}>
						<TextInput
							style={styles.input}
							value={form.address}
							onChangeText={handleAddressChange}
							placeholder="Start typing address... (e.g., 1208 Cai)"
							placeholderTextColor="#999"
						/>
						{showSuggestions && addressSuggestions.length > 0 && (
							<View style={styles.suggestionsContainer}>
								{addressSuggestions.map((suggestion, index) => (
									<TouchableOpacity
										key={index}
										style={styles.suggestionItem}
										onPress={() => selectSuggestion(suggestion)}
									>
										<ThemedText style={styles.suggestionText}>
											📍 {suggestion.address}
										</ThemedText>
									</TouchableOpacity>
								))}
							</View>
						)}
					</View>
					<TouchableOpacity
						style={styles.currentLocationButton}
						onPress={handleUseCurrentLocation}
					>
						<ThemedText style={styles.currentLocationText}>
							📍 Use Current Location
						</ThemedText>
					</TouchableOpacity>
					<ThemedText style={styles.addressHint}>
						Type at least 3 characters to see address suggestions
					</ThemedText>
				</View>

				<View style={styles.section}>
					<ThemedText style={styles.label}>Start Date & Time *</ThemedText>
					<View style={styles.dateTimeRow}>
						<TouchableOpacity
							style={styles.dateTimeButton}
							onPress={() => setShowStartDatePicker(true)}
						>
							<ThemedText style={styles.dateTimeButtonText}>
								{form.startDateTime || "Pick Date & Time"}
							</ThemedText>
						</TouchableOpacity>
					</View>
					{showStartDatePicker && (
						<DateTimePicker
							value={startDate}
							mode="datetime"
							is24Hour={false}
							display="default"
							onChange={handleStartDateChange}
						/>
					)}
				</View>

				<View style={styles.section}>
					<ThemedText style={styles.label}>End Date & Time *</ThemedText>
					<View style={styles.dateTimeRow}>
						<TouchableOpacity
							style={styles.dateTimeButton}
							onPress={() => setShowEndDatePicker(true)}
						>
							<ThemedText style={styles.dateTimeButtonText}>
								{form.endDateTime || "Pick Date & Time"}
							</ThemedText>
						</TouchableOpacity>
					</View>
					{showEndDatePicker && (
						<DateTimePicker
							value={endDate}
							mode="datetime"
							is24Hour={false}
							display="default"
							onChange={handleEndDateChange}
						/>
					)}
				</View>

				<View style={styles.section}>
					<ThemedText style={styles.label}>Your Name *</ThemedText>
					<TextInput
						style={styles.input}
						value={form.contactName}
						onChangeText={(text) => setForm({ ...form, contactName: text })}
						placeholder="John Doe"
						placeholderTextColor="#999"
					/>
				</View>

				<View style={styles.section}>
					<ThemedText style={styles.label}>Phone Number</ThemedText>
					<TextInput
						style={styles.input}
						value={form.contactPhone}
						onChangeText={(text) => setForm({ ...form, contactPhone: text })}
						placeholder="306-555-0123"
						placeholderTextColor="#999"
						keyboardType="phone-pad"
					/>
				</View>

				<View style={styles.section}>
					<ThemedText style={styles.label}>Email</ThemedText>
					<TextInput
						style={styles.input}
						value={form.contactEmail}
						onChangeText={(text) => setForm({ ...form, contactEmail: text })}
						placeholder="your@email.com"
						placeholderTextColor="#999"
						keyboardType="email-address"
						autoCapitalize="none"
					/>
				</View>

				<TouchableOpacity
					style={[styles.submitButton, loading && styles.submitButtonDisabled]}
					onPress={handleSubmit}
					disabled={loading}
				>
					<ThemedText style={styles.submitButtonText}>
						{loading ? "Posting..." : "Post Garage Sale"}
					</ThemedText>
				</TouchableOpacity>

				<View style={styles.bottomPadding} />
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f5f5f5",
	},
	analyzingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 40,
	},
	analyzingSubtext: {
		fontSize: 16,
		marginTop: 10,
		marginBottom: 30,
		textAlign: "center",
		opacity: 0.7,
	},
	stepsContainer: {
		backgroundColor: "#fff",
		padding: 20,
		borderRadius: 10,
		width: "100%",
	},
	step: {
		fontSize: 16,
		marginBottom: 10,
	},
	header: {
		padding: 20,
		paddingTop: Platform.OS === "ios" ? 60 : 40,
		flexDirection: "row",
		alignItems: "center",
		borderBottomWidth: 1,
		borderBottomColor: "#e0e0e0",
	},
	backButton: {
		marginRight: 15,
		width: 32,
		height: 32,
		justifyContent: "center",
		alignItems: "center",
	},
	backButtonText: {
		fontSize: 24,
		fontWeight: "bold",
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		padding: 20,
	},
	aiNotice: {
		backgroundColor: "#e3f2fd",
		padding: 15,
		borderRadius: 10,
		marginBottom: 20,
		borderLeftWidth: 4,
		borderLeftColor: "#2196F3",
	},
	aiNoticeText: {
		fontSize: 14,
		color: "#1565C0",
		lineHeight: 20,
	},
	section: {
		marginBottom: 20,
	},
	label: {
		fontSize: 16,
		fontWeight: "bold",
		marginBottom: 8,
	},
	dateTimeRow: {
		flexDirection: "row",
		gap: 10,
	},
	dateTimeButton: {
		flex: 1,
		backgroundColor: "white",
		borderWidth: 1,
		borderColor: "#ddd",
		borderRadius: 8,
		padding: 12,
		justifyContent: "center",
	},
	dateTimeButtonText: {
		fontSize: 16,
		color: "#333",
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
	addressContainer: {
		position: "relative",
		zIndex: 1000,
	},
	suggestionsContainer: {
		backgroundColor: "white",
		borderWidth: 1,
		borderColor: "#ddd",
		borderRadius: 8,
		marginTop: 5,
		maxHeight: 200,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	suggestionItem: {
		padding: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#f0f0f0",
	},
	suggestionText: {
		fontSize: 14,
	},
	currentLocationButton: {
		backgroundColor: "#4CAF50",
		padding: 12,
		borderRadius: 8,
		alignItems: "center",
		marginTop: 10,
	},
	addressHint: {
		fontSize: 12,
		marginTop: 5,
		opacity: 0.6,
		fontStyle: "italic",
	},
	currentLocationText: {
		color: "white",
		fontSize: 16,
		fontWeight: "600",
	},
	row: {
		flexDirection: "row",
		gap: 10,
	},
	halfWidth: {
		flex: 1,
	},
	submitButton: {
		backgroundColor: "#0066FF",
		padding: 16,
		borderRadius: 10,
		alignItems: "center",
		marginTop: 20,
	},
	submitButtonDisabled: {
		backgroundColor: "#ccc",
	},
	submitButtonText: {
		color: "white",
		fontSize: 18,
		fontWeight: "bold",
	},
	bottomPadding: {
		height: 40,
	},
});
