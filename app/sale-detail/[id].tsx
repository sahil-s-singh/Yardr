import { garageSaleService } from "@/services/garageSaleService";
import { GarageSale } from "@/types/garageSale";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import * as Linking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	Platform,
	ScrollView,
	Share,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

const CATEGORY_COLORS: Record<string, string> = {
	Furniture: "#DF6B4F",
	Electronics: "#6BAA8E",
	Kids: "#6366B5",
	Kitchen: "#E3BF60",
	Clothing: "#F9AD85",
	Books: "#6BAA8E",
	Sports: "#6366B5",
	Tools: "#807A73",
};

function haversineKm(
	a: { latitude: number; longitude: number },
	b: { latitude: number; longitude: number }
) {
	const R = 6371;
	const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
	const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
	const lat1 = (a.latitude * Math.PI) / 180;
	const lat2 = (b.latitude * Math.PI) / 180;

	const x =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

	return R * (2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
}

export default function ViewSaleScreen() {
	const { id } = useLocalSearchParams();
	const [loading, setLoading] = useState(true);
	const [sale, setSale] = useState<GarageSale | null>(null);
	const [userLoc, setUserLoc] = useState<{
		latitude: number;
		longitude: number;
	} | null>(null);

	useEffect(() => {
		loadSale();
		loadUserLocation();
	}, [id]);

	const loadUserLocation = useCallback(async () => {
		try {
			const perm = await Location.requestForegroundPermissionsAsync();
			if (perm.status === "granted") {
				const pos = await Location.getCurrentPositionAsync({});
				setUserLoc({
					latitude: pos.coords.latitude,
					longitude: pos.coords.longitude,
				});
			}
		} catch (error) {
			console.error("Error getting user location:", error);
		}
	}, []);

	const loadSale = async () => {
		try {
			const saleData = await garageSaleService.getGarageSaleById(id as string);
			if (!saleData) {
				Alert.alert("Error", "Garage sale not found");
				router.back();
				return;
			}
			setSale(saleData);
		} catch (error) {
			console.error("Error loading sale:", error);
			Alert.alert("Error", "Failed to load garage sale");
			router.back();
		} finally {
			setLoading(false);
		}
	};

	const distanceText = useMemo(() => {
		if (!sale || !userLoc) return null;
		const km = haversineKm(userLoc, sale.location);
		const feet = km * 3280.84;
		return feet >= 5280
			? `${(feet / 5280).toFixed(1)} mi`
			: `${Math.round(feet)} ft`;
	}, [sale, userLoc]);

	const formatFullDate = (dateStr: string) => {
		return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
			weekday: "long",
			month: "long",
			day: "numeric",
			year: "numeric",
		});
	};

	const formatTimeRange = (startTime?: string, endTime?: string) => {
		if (!startTime || !endTime) return "";
		const to12 = (t: string) => {
			const [hh, mm] = t.split(":").map(Number);
			const ampm = hh >= 12 ? "PM" : "AM";
			const h = ((hh + 11) % 12) + 1;
			return `${h}:${String(mm).padStart(2, "0")} ${ampm}`;
		};
		return `${to12(startTime)} \u2013 ${to12(endTime)}`;
	};

	const handleShare = async () => {
		if (!sale) return;

		const dateStr = formatFullDate(sale.startDate || sale.date);
		const timeStr = formatTimeRange(sale.startTime, sale.endTime);
		const deepLink = `yardr://sale-detail/${sale.id}`;
		const shareText = `${sale.title}\n\n${dateStr}\n${timeStr}\n\n${sale.location.address}\n\n${deepLink}`;

		try {
			await Share.share(
				Platform.OS === "ios"
					? { title: sale.title, message: shareText, url: deepLink }
					: { title: sale.title, message: shareText }
			);
		} catch (error) {
			console.error("Error sharing:", error);
		}
	};

	const handleGetDirections = async () => {
		if (!sale) return;

		const { latitude, longitude, address } = sale.location;

		if (latitude && longitude) {
			if (Platform.OS === "ios") {
				const url = `http://maps.apple.com/?daddr=${latitude},${longitude}`;
				Linking.openURL(url);
			} else {
				const navUrl = `google.navigation:q=${latitude},${longitude}`;
				const webUrl = `https://maps.google.com/?q=${latitude},${longitude}`;

				const canOpen = await Linking.canOpenURL(navUrl);
				Linking.openURL(canOpen ? navUrl : webUrl);
			}
		} else if (address) {
			const encodedAddress = encodeURIComponent(address);
			const url =
				Platform.OS === "ios"
					? `http://maps.apple.com/?q=${encodedAddress}`
					: `https://maps.google.com/?q=${encodedAddress}`;
			Linking.openURL(url);
		}
	};

	const handleCall = () => {
		if (!sale?.contactPhone) return;
		Linking.openURL(`tel:${sale.contactPhone}`);
	};

	const handleMessage = () => {
		if (!sale?.contactPhone) return;
		Linking.openURL(`sms:${sale.contactPhone}`);
	};

	if (loading || !sale) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#DF6B4F" />
			</View>
		);
	}

	const heroImage = sale.images?.[0] || null;

	return (
		<View style={styles.container}>
			{/* Hero Image */}
			<View style={styles.heroContainer}>
				{heroImage ? (
					<Image source={{ uri: heroImage }} style={styles.heroImage} />
				) : (
					<View style={styles.heroPlaceholder}>
						<MaterialIcons name="photo" size={48} color="#C4BFB8" />
					</View>
				)}

				{/* Back Button */}
				<TouchableOpacity
					style={styles.floatingButton}
					onPress={() => router.back()}
					activeOpacity={0.8}
				>
					<MaterialIcons name="chevron-left" size={28} color="#23201C" />
				</TouchableOpacity>

				{/* Share Button */}
				<TouchableOpacity
					style={[styles.floatingButton, styles.floatingButtonRight]}
					onPress={handleShare}
					activeOpacity={0.8}
				>
					<MaterialIcons name="share" size={22} color="#23201C" />
				</TouchableOpacity>
			</View>

			{/* Scrollable Content */}
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.contentCard}>
					{/* Title + Distance */}
					<View style={styles.titleRow}>
						<Text style={styles.title}>{sale.title}</Text>
						{distanceText && (
							<View style={styles.distanceBadge}>
								<Text style={styles.distanceText}>{distanceText}</Text>
							</View>
						)}
					</View>

					{/* Date and Time Card */}
					<View style={styles.infoCard}>
						<Text style={styles.infoTitle}>
							{formatFullDate(sale.startDate || sale.date)}
						</Text>
						<Text style={styles.infoSub}>
							{formatTimeRange(sale.startTime, sale.endTime)}
						</Text>
					</View>

					{/* Description */}
					{sale.description && (
						<View style={styles.descSection}>
							<Text style={styles.descLabel}>Description</Text>
							<Text style={styles.descText}>{sale.description}</Text>
						</View>
					)}

					{/* Categories */}
					{sale.categories && sale.categories.length > 0 && (
						<View style={styles.tagsRow}>
							{sale.categories.map((category, index) => {
								const color = CATEGORY_COLORS[category] || "#807A73";
								return (
									<View
										key={index}
										style={[
											styles.tag,
											{
												borderColor: color,
											},
										]}
									>
										<Text style={[styles.tagText, { color }]}>
											{category}
										</Text>
									</View>
								);
							})}
						</View>
					)}

					{/* Location Card */}
					<View style={styles.infoCard}>
						<Text style={styles.locationLabel}>Location</Text>
						<Text style={styles.locationAddress}>
							{sale.location.address}
						</Text>
					</View>

					{/* Host Section */}
					{sale.contactName && (
						<View style={styles.hostCard}>
							<View style={styles.hostAvatar}>
								<MaterialIcons name="person" size={24} color="#807A73" />
							</View>
							<View style={styles.hostInfo}>
								<Text style={styles.hostName}>
									Hosted by {sale.contactName}
								</Text>
								<Text style={styles.hostRole}>Verified seller</Text>
							</View>
							{sale.contactPhone && (
								<View style={styles.hostActions}>
									<TouchableOpacity
										style={styles.hostActionButton}
										onPress={handleCall}
										activeOpacity={0.7}
									>
										<MaterialIcons name="phone" size={18} color="#DF6B4F" />
									</TouchableOpacity>
									<TouchableOpacity
										style={styles.hostActionButton}
										onPress={handleMessage}
										activeOpacity={0.7}
									>
										<MaterialIcons name="sms" size={18} color="#DF6B4F" />
									</TouchableOpacity>
								</View>
							)}
						</View>
					)}
				</View>
			</ScrollView>

			{/* Fixed Get Directions Button */}
			<View style={styles.ctaContainer}>
				<TouchableOpacity
					onPress={handleGetDirections}
					activeOpacity={0.9}
				>
					<LinearGradient
						colors={["#DF6B4F", "#F9AD85"]}
						start={{ x: 0, y: 0.5 }}
						end={{ x: 1, y: 0.5 }}
						style={styles.ctaButton}
					>
						<Text style={styles.ctaText}>Get Directions</Text>
					</LinearGradient>
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F7F6F4",
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#F7F6F4",
	},

	heroContainer: {
		height: 280,
		width: "100%",
		position: "relative",
	},
	heroImage: {
		width: "100%",
		height: "100%",
	},
	heroPlaceholder: {
		width: "100%",
		height: "100%",
		backgroundColor: "#F1EDE8",
		justifyContent: "center",
		alignItems: "center",
	},
	floatingButton: {
		position: "absolute",
		top: 54,
		left: 16,
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
	},
	floatingButtonRight: {
		left: undefined,
		right: 16,
	},

	scrollView: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: 110,
	},
	contentCard: {
		backgroundColor: "#F7F6F4",
		padding: 20,
	},

	titleRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 16,
	},
	title: {
		fontSize: 22,
		fontWeight: "900",
		color: "#23201C",
		letterSpacing: -0.3,
		flex: 1,
	},
	distanceBadge: {
		backgroundColor: "#F1EDE8",
		borderRadius: 12,
		paddingVertical: 6,
		paddingHorizontal: 12,
		marginLeft: 12,
	},
	distanceText: {
		fontSize: 13,
		fontWeight: "700",
		color: "#23201C",
	},

	infoCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 18,
		padding: 16,
		marginBottom: 16,
	},
	infoTitle: {
		fontSize: 15,
		fontWeight: "700",
		color: "#23201C",
		marginBottom: 4,
	},
	infoSub: {
		fontSize: 14,
		color: "#807A73",
		fontWeight: "500",
	},

	descSection: {
		marginBottom: 16,
	},
	descLabel: {
		fontSize: 16,
		fontWeight: "800",
		color: "#23201C",
		marginBottom: 8,
	},
	descText: {
		fontSize: 15,
		lineHeight: 22,
		color: "#23201C",
	},

	tagsRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
		marginBottom: 16,
	},
	tag: {
		borderRadius: 999,
		paddingHorizontal: 14,
		paddingVertical: 7,
		borderWidth: 1.5,
	},
	tagText: {
		fontSize: 13,
		fontWeight: "600",
	},

	locationLabel: {
		fontSize: 15,
		fontWeight: "700",
		color: "#23201C",
		marginBottom: 4,
	},
	locationAddress: {
		fontSize: 14,
		color: "#807A73",
		fontWeight: "500",
	},

	hostCard: {
		flexDirection: "row",
		alignItems: "center",
		padding: 16,
		backgroundColor: "#FFFFFF",
		borderRadius: 18,
		marginTop: 4,
	},
	hostAvatar: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: "#F1EDE8",
		justifyContent: "center",
		alignItems: "center",
		marginRight: 12,
	},
	hostInfo: {
		flex: 1,
	},
	hostName: {
		fontSize: 15,
		fontWeight: "600",
		color: "#23201C",
		marginBottom: 2,
	},
	hostRole: {
		fontSize: 13,
		color: "#807A73",
		fontWeight: "500",
	},
	hostActions: {
		flexDirection: "row",
		gap: 8,
	},
	hostActionButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "#FFFFFF",
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 1,
		borderColor: "#E8E5E1",
	},

	ctaContainer: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		padding: 20,
		paddingBottom: 40,
	},
	ctaButton: {
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
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "700",
	},
});
