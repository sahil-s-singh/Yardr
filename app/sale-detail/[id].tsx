// app/sale-detail/[id].tsx
import FavoriteButton from "@/components/FavoriteButton";
import ReminderButton from "@/components/ReminderButton";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/contexts/AuthContext";
import { garageSaleService } from "@/services/garageSaleService";
import { historyService } from "@/services/historyService";
import { GarageSale } from "@/types/garageSale";
import { ResizeMode, Video } from "expo-av";
import { Image } from "expo-image";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
	Alert,
	Dimensions,
	Linking,
	Platform,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
	View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function SaleDetailScreen() {
	const { id } = useLocalSearchParams();
	const { user, isAuthenticated } = useAuth();
	const [sale, setSale] = useState<GarageSale | null>(null);
	const [loading, setLoading] = useState(true);
	const [userLocation, setUserLocation] = useState<{
		latitude: number;
		longitude: number;
	} | null>(null);

	useEffect(() => {
		loadSale();
		getUserLocation();
	}, [id]);

	const loadSale = async () => {
		try {
			const saleData = await garageSaleService.getGarageSaleById(id as string);
			if (saleData) {
				setSale(saleData);

				// Track view if authenticated
				if (isAuthenticated && user) {
					historyService.recordView(user.id, id as string);
				}
			} else {
				Alert.alert("Error", "Garage sale not found");
				router.back();
			}
		} catch (error) {
			console.error("Error loading sale:", error);
			Alert.alert("Error", "Failed to load garage sale");
			router.back();
		} finally {
			setLoading(false);
		}
	};

	const getUserLocation = async () => {
		try {
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status === "granted") {
				const location = await Location.getCurrentPositionAsync({});
				setUserLocation({
					latitude: location.coords.latitude,
					longitude: location.coords.longitude,
				});
			}
		} catch (error) {
			console.error("Error getting location:", error);
		}
	};

	const calculateDistance = (): string => {
		if (!userLocation || !sale) return "N/A";

		const R = 6371;
		const dLat = toRad(sale.location.latitude - userLocation.latitude);
		const dLon = toRad(sale.location.longitude - userLocation.longitude);
		const lat1 = toRad(userLocation.latitude);
		const lat2 = toRad(sale.location.latitude);

		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		const distance = R * c;

		if (distance < 1) {
			return `${Math.round(distance * 1000)}m away`;
		}
		return `${distance.toFixed(1)}km away`;
	};

	const toRad = (value: number): number => {
		return (value * Math.PI) / 180;
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			weekday: "long",
			month: "long",
			day: "numeric",
			year: "numeric",
		});
	};

	const formatTime = (time: string) => {
		const [hours, minutes] = time.split(":");
		const hour = parseInt(hours);
		const ampm = hour >= 12 ? "PM" : "AM";
		const displayHour = hour % 12 || 12;
		return `${displayHour}:${minutes} ${ampm}`;
	};

	const handleCall = () => {
		if (!sale?.contactPhone) {
			Alert.alert("No Phone", "No phone number provided for this sale");
			return;
		}
		const phoneUrl = `tel:${sale.contactPhone}`;
		Linking.openURL(phoneUrl);
	};

	const handleEmail = () => {
		if (!sale?.contactEmail) {
			Alert.alert("No Email", "No email address provided for this sale");
			return;
		}
		const emailUrl = `mailto:${sale.contactEmail}?subject=Inquiry about ${sale.title}`;
		Linking.openURL(emailUrl);
	};

	const handleGetDirections = () => {
		if (!sale) return;

		const { latitude, longitude } = sale.location;
		const label = encodeURIComponent(sale.title);

		const url = Platform.select({
			ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
			android: `geo:0,0?q=${latitude},${longitude}(${label})`,
			default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
		});

		Linking.openURL(url!);
	};

	if (loading) {
		return (
			<View style={styles.container}>
				<ThemedView style={styles.loadingContainer}>
					<ThemedText>Loading...</ThemedText>
				</ThemedView>
			</View>
		);
	}

	if (!sale) {
		return null;
	}

	return (
		<View style={styles.container}>
			<ScrollView contentContainerStyle={styles.content}>
				{/* Media Section */}
				{sale.videoUrl && (
					<Video
						source={{ uri: sale.videoUrl }}
						style={styles.video}
						resizeMode={ResizeMode.COVER}
						useNativeControls
						isLooping
					/>
				)}

				{!sale.videoUrl && sale.images && sale.images.length > 0 && (
					<ScrollView
						horizontal
						pagingEnabled
						showsHorizontalScrollIndicator={false}
					>
						{sale.images.map((image, idx) => (
							<Image
								key={idx}
								source={{ uri: image }}
								style={styles.image}
								contentFit="cover"
							/>
						))}
					</ScrollView>
				)}

				{!sale.videoUrl && (!sale.images || sale.images.length === 0) && (
					<View style={[styles.video, styles.noMedia]}>
						<ThemedText style={styles.noMediaText}>📦</ThemedText>
					</View>
				)}

				{/* Content Section */}
				<ThemedView style={styles.details}>
					{/* Title */}
					<ThemedText type="title" style={styles.title}>
						{sale.title}
					</ThemedText>

					{/* Date & Time */}
					<View style={styles.infoRow}>
						<ThemedText style={styles.icon}>📅</ThemedText>
						<View style={styles.infoContent}>
							<ThemedText style={styles.infoLabel}>When</ThemedText>
							<ThemedText style={styles.infoText}>
								{formatDate(sale.date)}
							</ThemedText>
							<ThemedText style={styles.infoText}>
								{formatTime(sale.startTime)} - {formatTime(sale.endTime)}
							</ThemedText>
						</View>
					</View>

					{/* Location */}
					<View style={styles.infoRow}>
						<ThemedText style={styles.icon}>📍</ThemedText>
						<View style={styles.infoContent}>
							<ThemedText style={styles.infoLabel}>Location</ThemedText>
							<ThemedText style={styles.infoText}>
								{sale.location.address}
							</ThemedText>
							<ThemedText style={styles.distanceText}>
								{calculateDistance()}
							</ThemedText>
						</View>
					</View>

					{/* Categories/Tags */}
					{sale.categories && sale.categories.length > 0 && (
						<View style={styles.infoRow}>
							<ThemedText style={styles.icon}>🏷️</ThemedText>
							<View style={styles.infoContent}>
								<ThemedText style={styles.infoLabel}>Categories</ThemedText>
								<View style={styles.categoriesContainer}>
									{sale.categories.map((cat, idx) => (
										<View key={idx} style={styles.categoryTag}>
											<ThemedText style={styles.categoryText}>{cat}</ThemedText>
										</View>
									))}
								</View>
							</View>
						</View>
					)}

					{/* Description */}
					{sale.description && (
						<View style={styles.infoRow}>
							<ThemedText style={styles.icon}>📝</ThemedText>
							<View style={styles.infoContent}>
								<ThemedText style={styles.infoLabel}>Description</ThemedText>
								<ThemedText style={styles.descriptionText}>
									{sale.description}
								</ThemedText>
							</View>
						</View>
					)}

					{/* Contact */}
					<View style={styles.infoRow}>
						<ThemedText style={styles.icon}>👤</ThemedText>
						<View style={styles.infoContent}>
							<ThemedText style={styles.infoLabel}>Contact</ThemedText>
							<ThemedText style={styles.infoText}>
								{sale.contactName}
							</ThemedText>
						</View>
					</View>

					{/* Action Buttons */}
					<View style={styles.actionsContainer}>
						<TouchableOpacity
							style={styles.actionButton}
							onPress={handleGetDirections}
						>
							<ThemedText style={styles.actionButtonText}>
								🗺️ Directions
							</ThemedText>
						</TouchableOpacity>

						{sale.contactPhone && (
							<TouchableOpacity
								style={styles.actionButton}
								onPress={handleCall}
							>
								<ThemedText style={styles.actionButtonText}>📞 Call</ThemedText>
							</TouchableOpacity>
						)}

						{sale.contactEmail && (
							<TouchableOpacity
								style={styles.actionButton}
								onPress={handleEmail}
							>
								<ThemedText style={styles.actionButtonText}>
									✉️ Email
								</ThemedText>
							</TouchableOpacity>
						)}
					</View>

					{/* Favorite & Reminder */}
					<View style={styles.savedActionsContainer}>
						<FavoriteButton garageSaleId={sale.id} size={24} showLabel />
						<ReminderButton
							garageSaleId={sale.id}
							garageSaleTitle={sale.title}
							garageSaleDate={sale.startDate || sale.date}
							size={24}
							showLabel
						/>
					</View>
				</ThemedView>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	content: {
		paddingBottom: 40,
	},
	video: {
		width: width,
		height: 250,
		backgroundColor: "#000",
	},
	image: {
		width: width,
		height: 250,
	},
	noMedia: {
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#f0f0f0",
	},
	noMediaText: {
		fontSize: 64,
		opacity: 0.3,
	},
	details: {
		padding: 20,
	},
	title: {
		marginBottom: 24,
	},
	infoRow: {
		flexDirection: "row",
		marginBottom: 20,
	},
	icon: {
		fontSize: 24,
		marginRight: 12,
		width: 32,
	},
	infoContent: {
		flex: 1,
	},
	infoLabel: {
		fontSize: 12,
		textTransform: "uppercase",
		opacity: 0.6,
		marginBottom: 4,
		fontWeight: "600",
		letterSpacing: 0.5,
	},
	infoText: {
		fontSize: 16,
		marginBottom: 2,
	},
	distanceText: {
		fontSize: 14,
		opacity: 0.7,
		marginTop: 4,
	},
	descriptionText: {
		fontSize: 15,
		lineHeight: 22,
		opacity: 0.9,
	},
	categoriesContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
		marginTop: 4,
	},
	categoryTag: {
		backgroundColor: "#E3F2FD",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
	},
	categoryText: {
		fontSize: 13,
		color: "#1976D2",
		fontWeight: "500",
	},
	actionsContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 10,
		marginTop: 24,
		marginBottom: 16,
	},
	actionButton: {
		flex: 1,
		minWidth: 100,
		backgroundColor: "#0066FF",
		paddingVertical: 14,
		paddingHorizontal: 16,
		borderRadius: 12,
		alignItems: "center",
	},
	actionButtonText: {
		color: "#fff",
		fontSize: 15,
		fontWeight: "600",
	},
	savedActionsContainer: {
		flexDirection: "row",
		justifyContent: "space-around",
		paddingTop: 16,
		borderTopWidth: 1,
		borderTopColor: "#e0e0e0",
		gap: 12,
	},
});
