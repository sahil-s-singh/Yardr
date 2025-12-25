// app/sale-detail/[id].tsx
import FavoriteButton from "@/components/FavoriteButton";
import ReminderButton from "@/components/ReminderButton";
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
	Text,
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
			return `${Math.round(distance * 1000)} ft`;
		}
		return `${distance.toFixed(1)} km`;
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
		Linking.openURL(`tel:${sale.contactPhone}`);
	};

	const handleEmail = () => {
		if (!sale?.contactEmail) {
			Alert.alert("No Email", "No email address provided for this sale");
			return;
		}
		Linking.openURL(
			`mailto:${sale.contactEmail}?subject=Inquiry about ${sale.title}`
		);
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
				<View style={styles.loadingContainer}>
					<Text style={styles.loadingText}>Loading...</Text>
				</View>
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
				<View style={styles.mediaContainer}>
					{sale.videoUrl ? (
						<Video
							source={{ uri: sale.videoUrl }}
							style={styles.video}
							resizeMode={ResizeMode.COVER}
							useNativeControls
							isLooping
						/>
					) : sale.images && sale.images.length > 0 ? (
						<Image
							source={{ uri: sale.images[0] }}
							style={styles.video}
							contentFit="cover"
						/>
					) : (
						<View style={[styles.video, styles.noMedia]}>
							<Text style={styles.noMediaText}>📦</Text>
						</View>
					)}
				</View>

				{/* Content Card */}
				<View style={styles.detailsCard}>
					{/* Title */}
					<Text style={styles.title}>{sale.title}</Text>

					{/* Date & Time Section */}
					<View style={styles.infoSection}>
						<View style={styles.infoHeader}>
							<Text style={styles.infoIcon}>📅</Text>
							<Text style={styles.infoTitle}>When</Text>
						</View>
						<Text style={styles.infoValue}>{formatDate(sale.date)}</Text>
						<Text style={styles.infoValue}>
							{formatTime(sale.startTime)} - {formatTime(sale.endTime)}
						</Text>
					</View>

					{/* Location Section */}
					<View style={styles.infoSection}>
						<View style={styles.infoHeader}>
							<Text style={styles.infoIcon}>📍</Text>
							<Text style={styles.infoTitle}>Location</Text>
						</View>
						<Text style={styles.infoValue}>{sale.location.address}</Text>
						<Text style={styles.distanceText}>{calculateDistance()} away</Text>
					</View>

					{/* Categories Section */}
					{sale.categories && sale.categories.length > 0 && (
						<View style={styles.infoSection}>
							<View style={styles.infoHeader}>
								<Text style={styles.infoIcon}>🏷️</Text>
								<Text style={styles.infoTitle}>Categories</Text>
							</View>
							<View style={styles.tagsContainer}>
								{sale.categories.map((cat, idx) => (
									<View key={idx} style={styles.tag}>
										<Text style={styles.tagText}>{cat}</Text>
									</View>
								))}
							</View>
						</View>
					)}

					{/* Description Section */}
					{sale.description && (
						<View style={styles.infoSection}>
							<View style={styles.infoHeader}>
								<Text style={styles.infoIcon}>📝</Text>
								<Text style={styles.infoTitle}>Description</Text>
							</View>
							<Text style={styles.descriptionText}>{sale.description}</Text>
						</View>
					)}

					{/* Contact Section */}
					<View style={styles.infoSection}>
						<View style={styles.infoHeader}>
							<Text style={styles.infoIcon}>👤</Text>
							<Text style={styles.infoTitle}>Contact</Text>
						</View>
						<Text style={styles.infoValue}>{sale.contactName}</Text>
					</View>
				</View>

				{/* Action Buttons */}
				<View style={styles.actionsCard}>
					<TouchableOpacity
						style={styles.primaryButton}
						onPress={handleGetDirections}
						activeOpacity={0.8}
					>
						<Text style={styles.buttonIcon}>🗺️</Text>
						<Text style={styles.primaryButtonText}>Get Directions</Text>
					</TouchableOpacity>

					<View style={styles.secondaryButtons}>
						{sale.contactPhone && (
							<TouchableOpacity
								style={styles.secondaryButton}
								onPress={handleCall}
								activeOpacity={0.8}
							>
								<Text style={styles.buttonIcon}>📞</Text>
								<Text style={styles.secondaryButtonText}>Call</Text>
							</TouchableOpacity>
						)}

						{sale.contactEmail && (
							<TouchableOpacity
								style={styles.secondaryButton}
								onPress={handleEmail}
								activeOpacity={0.8}
							>
								<Text style={styles.buttonIcon}>✉️</Text>
								<Text style={styles.secondaryButtonText}>Email</Text>
							</TouchableOpacity>
						)}
					</View>
				</View>

				{/* Save Actions */}
				<View style={styles.saveActionsCard}>
					<FavoriteButton garageSaleId={sale.id} size={24} showLabel />
					<ReminderButton
						garageSaleId={sale.id}
						garageSaleTitle={sale.title}
						garageSaleDate={sale.startDate || sale.date}
						size={24}
						showLabel
					/>
				</View>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#0A0A0A",
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	loadingText: {
		fontSize: 16,
		color: "#999",
	},
	content: {
		paddingBottom: 40,
	},
	mediaContainer: {
		width: width,
		height: 280,
		backgroundColor: "#1A1A1A",
	},
	video: {
		width: "100%",
		height: "100%",
	},
	noMedia: {
		justifyContent: "center",
		alignItems: "center",
	},
	noMediaText: {
		fontSize: 64,
		opacity: 0.3,
	},
	detailsCard: {
		backgroundColor: "#1A1A1A",
		margin: 20,
		marginBottom: 12,
		padding: 20,
		borderRadius: 16,
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#FFF",
		marginBottom: 24,
	},
	infoSection: {
		marginBottom: 20,
	},
	infoHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginBottom: 8,
	},
	infoIcon: {
		fontSize: 18,
	},
	infoTitle: {
		fontSize: 12,
		fontWeight: "600",
		color: "#999",
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	infoValue: {
		fontSize: 16,
		color: "#FFF",
		marginBottom: 4,
	},
	distanceText: {
		fontSize: 14,
		color: "#999",
		marginTop: 4,
	},
	descriptionText: {
		fontSize: 15,
		lineHeight: 22,
		color: "#CCC",
	},
	tagsContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	tag: {
		backgroundColor: "#2A2A2A",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 12,
	},
	tagText: {
		fontSize: 13,
		color: "#999",
		fontWeight: "500",
	},
	actionsCard: {
		backgroundColor: "#1A1A1A",
		marginHorizontal: 20,
		marginBottom: 12,
		padding: 16,
		borderRadius: 16,
		gap: 12,
	},
	primaryButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#007AFF",
		paddingVertical: 14,
		borderRadius: 12,
		gap: 8,
	},
	buttonIcon: {
		fontSize: 18,
	},
	primaryButtonText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#FFF",
	},
	secondaryButtons: {
		flexDirection: "row",
		gap: 12,
	},
	secondaryButton: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#2A2A2A",
		paddingVertical: 12,
		borderRadius: 12,
		gap: 6,
	},
	secondaryButtonText: {
		fontSize: 15,
		fontWeight: "600",
		color: "#FFF",
	},
	saveActionsCard: {
		backgroundColor: "#1A1A1A",
		marginHorizontal: 20,
		padding: 16,
		borderRadius: 16,
		flexDirection: "row",
		justifyContent: "space-around",
		gap: 12,
	},
});
