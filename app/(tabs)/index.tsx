import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { garageSaleService } from "@/services/garageSaleService";
import { GarageSale } from "@/types/garageSale";
import { ResizeMode, Video } from "expo-av";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
	Alert,
	Image,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
	View,
} from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";

export default function DiscoverScreen() {
	const [location, setLocation] = useState<any>(null);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const [garageSales, setGarageSales] = useState<GarageSale[]>([]);
	const [loading, setLoading] = useState(true);
	const [viewMode, setViewMode] = useState<"list" | "map">("list");

	useEffect(() => {
		(async () => {
			try {
				let { status } = await Location.requestForegroundPermissionsAsync();
				if (status !== "granted") {
					setErrorMsg("Permission to access location was denied");
					Alert.alert(
						"Permission Denied",
						"Please enable location services to use this feature"
					);
					setLoading(false);
					return;
				}

				let currentLocation = await Location.getCurrentPositionAsync({
					accuracy: Location.Accuracy.High,
				});

				setLocation({
					latitude: currentLocation.coords.latitude,
					longitude: currentLocation.coords.longitude,
					latitudeDelta: 0.0922,
					longitudeDelta: 0.0421,
				});
			} catch (error: any) {
				console.error("Error getting location:", error);
				setErrorMsg("Error getting location: " + error.message);
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	useEffect(() => {
		if (location) {
			loadGarageSales();
		}
	}, [location]);

	const loadGarageSales = async () => {
		try {
			const sales = await garageSaleService.getAllGarageSales();
			setGarageSales(sales);
		} catch (error) {
			console.error("Error loading garage sales:", error);
			Alert.alert("Error", "Failed to load garage sales");
		}
	};

	const calculateDistance = (saleLat: number, saleLng: number): string => {
		if (!location) return "N/A";

		const R = 6371; // Earth's radius in km
		const dLat = toRad(saleLat - location.latitude);
		const dLon = toRad(saleLng - location.longitude);
		const lat1 = toRad(location.latitude);
		const lat2 = toRad(saleLat);

		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		const distance = R * c;

		if (distance < 1) {
			return `${Math.round(distance * 1000)}m`;
		}
		return `${distance.toFixed(1)}km`;
	};

	const toRad = (value: number): number => {
		return (value * Math.PI) / 180;
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			weekday: "short",
			month: "short",
			day: "numeric",
		});
	};

	const formatTime = (time: string) => {
		const [hours, minutes] = time.split(":");
		const hour = parseInt(hours);
		const ampm = hour >= 12 ? "PM" : "AM";
		const displayHour = hour % 12 || 12;
		return `${displayHour}:${minutes} ${ampm}`;
	};

	const isOpen = (sale: GarageSale): boolean => {
		const now = new Date();
		const saleDate = new Date(sale.date);
		const [startHour, startMin] = sale.startTime.split(":").map(Number);
		const [endHour, endMin] = sale.endTime.split(":").map(Number);

		saleDate.setHours(startHour, startMin, 0);
		const endTime = new Date(sale.date);
		endTime.setHours(endHour, endMin, 0);

		return now >= saleDate && now <= endTime;
	};

	const renderListView = () => (
		<ScrollView
			style={styles.listContainer}
			contentContainerStyle={styles.listContent}
		>
			{garageSales.map((sale) => (
				<TouchableOpacity
					key={sale.id}
					style={styles.saleCard}
					onPress={() => router.push(`/sale-detail/${sale.id}`)}
				>
					{/* Media Section */}
					{sale.videoUrl ? (
						<Video
							source={{ uri: sale.videoUrl }}
							style={styles.cardMedia}
							resizeMode={ResizeMode.COVER}
							isLooping
							isMuted
							shouldPlay={false}
						/>
					) : sale.images && sale.images.length > 0 ? (
						<View style={styles.cardMedia}>
							<Image
								source={{ uri: sale.images[0] }}
								style={styles.cardImage}
							/>
						</View>
					) : (
						<View style={[styles.cardMedia, styles.noMedia]}>
							<ThemedText style={styles.noMediaText}>📦</ThemedText>
						</View>
					)}

					{/* Status Badge */}
					<View
						style={[
							styles.statusBadge,
							isOpen(sale) ? styles.openBadge : styles.closedBadge,
						]}
					>
						<ThemedText style={styles.statusText}>
							{isOpen(sale) ? "● Open" : "● Closed"}
						</ThemedText>
					</View>

					{/* Content */}
					<View style={styles.cardContent}>
						<ThemedText style={styles.cardTitle}>{sale.title}</ThemedText>

						<View style={styles.cardRow}>
							<ThemedText style={styles.cardIcon}>📍</ThemedText>
							<ThemedText style={styles.cardText}>
								{calculateDistance(
									sale.location.latitude,
									sale.location.longitude
								)}{" "}
								away
							</ThemedText>
						</View>

						<View style={styles.cardRow}>
							<ThemedText style={styles.cardIcon}>📅</ThemedText>
							<ThemedText style={styles.cardText}>
								{formatDate(sale.date)} • {formatTime(sale.startTime)}-
								{formatTime(sale.endTime)}
							</ThemedText>
						</View>

						{sale.categories && sale.categories.length > 0 && (
							<View style={styles.categoriesRow}>
								{sale.categories.slice(0, 3).map((cat, idx) => (
									<View key={idx} style={styles.categoryTag}>
										<ThemedText style={styles.categoryText}>{cat}</ThemedText>
									</View>
								))}
								{sale.categories.length > 3 && (
									<ThemedText style={styles.moreCategories}>
										+{sale.categories.length - 3}
									</ThemedText>
								)}
							</View>
						)}
					</View>
				</TouchableOpacity>
			))}
		</ScrollView>
	);

	const renderMapView = () => (
		<MapView
			style={styles.map}
			initialRegion={location}
			showsUserLocation={true}
			showsMyLocationButton={true}
			provider={PROVIDER_DEFAULT}
		>
			{garageSales.map((sale) => (
				<Marker
					key={sale.id}
					coordinate={{
						latitude: sale.location.latitude,
						longitude: sale.location.longitude,
					}}
					onPress={() => router.push(`/sale-detail/${sale.id}`)}
				>
					<View style={styles.markerContainer}>
						<View
							style={[
								styles.marker,
								isOpen(sale) ? styles.markerOpen : styles.markerClosed,
							]}
						>
							<ThemedText style={styles.markerText}>🏷️</ThemedText>
						</View>
					</View>
				</Marker>
			))}
		</MapView>
	);

	return (
		<View style={styles.container}>
			{/* Header */}
			<ThemedView style={styles.header}>
				<ThemedText type="title">Discover</ThemedText>
				<ThemedText style={styles.subtitle}>
					{garageSales.length} garage sales nearby
				</ThemedText>
			</ThemedView>

			{/* View Toggle */}
			<View style={styles.toggleContainer}>
				<TouchableOpacity
					style={[
						styles.toggleButton,
						viewMode === "list" && styles.toggleActive,
					]}
					onPress={() => setViewMode("list")}
				>
					<ThemedText
						style={[
							styles.toggleText,
							viewMode === "list" && styles.toggleTextActive,
						]}
					>
						📋 List
					</ThemedText>
				</TouchableOpacity>
				<TouchableOpacity
					style={[
						styles.toggleButton,
						viewMode === "map" && styles.toggleActive,
					]}
					onPress={() => setViewMode("map")}
				>
					<ThemedText
						style={[
							styles.toggleText,
							viewMode === "map" && styles.toggleTextActive,
						]}
					>
						🗺️ Map
					</ThemedText>
				</TouchableOpacity>
			</View>

			{/* Content */}
			{loading ? (
				<ThemedView style={styles.loadingContainer}>
					<ThemedText>Loading nearby sales...</ThemedText>
				</ThemedView>
			) : errorMsg ? (
				<ThemedView style={styles.loadingContainer}>
					<ThemedText>{errorMsg}</ThemedText>
				</ThemedView>
			) : viewMode === "list" ? (
				renderListView()
			) : (
				renderMapView()
			)}

			{/* Floating Add Button */}
			<TouchableOpacity
				style={styles.addButton}
				onPress={() => router.push("/add-sale")}
			>
				<ThemedText style={styles.addButtonText}>+</ThemedText>
			</TouchableOpacity>
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
	},
	subtitle: {
		fontSize: 14,
		marginTop: 4,
		opacity: 0.7,
	},
	toggleContainer: {
		flexDirection: "row",
		paddingHorizontal: 20,
		paddingBottom: 12,
		gap: 8,
	},
	toggleButton: {
		flex: 1,
		paddingVertical: 10,
		paddingHorizontal: 16,
		borderRadius: 8,
		backgroundColor: "#f0f0f0",
		alignItems: "center",
	},
	toggleActive: {
		backgroundColor: "#0066FF",
	},
	toggleText: {
		fontSize: 14,
		fontWeight: "600",
		color: "#666",
	},
	toggleTextActive: {
		color: "#fff",
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	listContainer: {
		flex: 1,
	},
	listContent: {
		padding: 16,
		paddingBottom: 100,
	},
	saleCard: {
		backgroundColor: "#fff",
		borderRadius: 16,
		marginBottom: 16,
		overflow: "hidden",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	cardMedia: {
		width: "100%",
		height: 180,
		backgroundColor: "#f0f0f0",
	},
	cardImage: {
		width: "100%",
		height: "100%",
	},
	noMedia: {
		justifyContent: "center",
		alignItems: "center",
	},
	noMediaText: {
		fontSize: 48,
		opacity: 0.3,
	},
	statusBadge: {
		position: "absolute",
		top: 12,
		right: 12,
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 12,
	},
	openBadge: {
		backgroundColor: "rgba(52, 199, 89, 0.9)",
	},
	closedBadge: {
		backgroundColor: "rgba(255, 59, 48, 0.9)",
	},
	statusText: {
		color: "#fff",
		fontSize: 12,
		fontWeight: "bold",
	},
	cardContent: {
		padding: 16,
	},
	cardTitle: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 12,
	},
	cardRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 6,
	},
	cardIcon: {
		fontSize: 14,
		marginRight: 8,
		width: 20,
	},
	cardText: {
		fontSize: 14,
		opacity: 0.8,
	},
	categoriesRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		marginTop: 8,
		gap: 6,
	},
	categoryTag: {
		backgroundColor: "#E3F2FD",
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 12,
	},
	categoryText: {
		fontSize: 12,
		color: "#1976D2",
		fontWeight: "500",
	},
	moreCategories: {
		fontSize: 12,
		opacity: 0.6,
		alignSelf: "center",
	},
	map: {
		flex: 1,
	},
	markerContainer: {
		alignItems: "center",
	},
	marker: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 3,
		elevation: 5,
	},
	markerOpen: {
		backgroundColor: "#34C759",
	},
	markerClosed: {
		backgroundColor: "#FF3B30",
	},
	markerText: {
		fontSize: 20,
	},
	addButton: {
		position: "absolute",
		bottom: 24,
		right: 20,
		width: 60,
		height: 60,
		borderRadius: 30,
		backgroundColor: "#0066FF",
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 4.65,
		elevation: 8,
	},
	addButtonText: {
		color: "white",
		fontSize: 32,
		fontWeight: "bold",
		lineHeight: 32,
	},
});
