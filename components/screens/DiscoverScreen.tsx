// components/screens/DiscoverScreen.tsx
import { useFocusEffect } from "@react-navigation/native";
import * as Linking from "expo-linking";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
	ActionSheetIOS,
	ActivityIndicator,
	FlatList,
	Image,
	Platform,
	RefreshControl,
	SafeAreaView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { garageSaleService } from "@/services/garageSaleService";
import { GarageSale } from "@/types/garageSale";

import GradientBackground from "@/components/ui/GradientBackground";
import HeaderBar from "@/components/ui/HeaderBar";
import SaleCard from "@/components/ui/SaleCard";
import StoriesBar from "@/components/ui/StoriesBar";
import StoryViewer from "@/components/ui/StoryViewer";

type Mode = "list" | "map";

type SaleWithDistance = GarageSale & {
	_distanceText: string;
};

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

export default function DiscoverScreen({ initialMode }: { initialMode: Mode }) {
	const colorScheme = useColorScheme();
	const theme = Colors[colorScheme ?? "light"];

	const [mode, setMode] = useState<Mode>(initialMode);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	const [userLoc, setUserLoc] = useState<{
		latitude: number;
		longitude: number;
	} | null>(null);
	const [addressLine, setAddressLine] = useState("");
	const [sales, setSales] = useState<GarageSale[]>([]);

	const [selectedStory, setSelectedStory] = useState<GarageSale | null>(null);
	const [storyViewerVisible, setStoryViewerVisible] = useState(false);
	const [selectedMarker, setSelectedMarker] = useState<SaleWithDistance | null>(null);

	const loadSales = useCallback(async () => {
		try {
			setLoading(true);

			const perm = await Location.requestForegroundPermissionsAsync();
			if (perm.status !== "granted") {
				const list = await garageSaleService.getAllGarageSales();
				setSales(list);
				setAddressLine("Enable location for better results");
				return;
			}

			const pos = await Location.getCurrentPositionAsync({});
			const loc = {
				latitude: pos.coords.latitude,
				longitude: pos.coords.longitude,
			};
			setUserLoc(loc);

			const geos = await Location.reverseGeocodeAsync(loc);
			setAddressLine(formatAddress(geos?.[0]) || "Your location");

			const list = await garageSaleService.getGarageSalesNearby(
				loc.latitude,
				loc.longitude
			);
			setSales(list);
		} catch (e: any) {
			console.error(
				"Discover loadSales error:",
				e?.message || e,
				e?.code,
				e?.details,
				e?.hint
			);
			setAddressLine((prev) => prev || "Location unavailable");
			try {
				const list = await garageSaleService.getAllGarageSales();
				setSales(list);
			} catch (err: any) {
				console.error(
					"Failed to load sales fallback:",
					err?.message || err,
					err?.code,
					err?.details,
					err?.hint
				);
			}
		} finally {
			setLoading(false);
		}
	}, []);

	useFocusEffect(
		useCallback(() => {
			loadSales();
		}, [loadSales])
	);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		try {
			await loadSales();
		} finally {
			setRefreshing(false);
		}
	}, [loadSales]);

	const salesWithDistance: SaleWithDistance[] = useMemo(() => {
		if (!userLoc) return sales.map((s) => ({ ...s, _distanceText: "" }));

		return sales.map((s) => {
			const km = haversineKm(userLoc, s.location);
			const feet = km * 3280.84;
			const distanceText =
				feet >= 5280
					? `${Math.round(feet / 5280)} mi`
					: `${Math.round(feet)} ft`;
			return { ...s, _distanceText: distanceText };
		});
	}, [sales, userLoc]);

	const mapRegion: Region = useMemo(
		() => ({
			latitude: userLoc?.latitude ?? 43.4516,
			longitude: userLoc?.longitude ?? -80.4925,
			latitudeDelta: 0.04,
			longitudeDelta: 0.04,
		}),
		[userLoc]
	);

	const handleStoryPress = useCallback((sale: GarageSale) => {
		setSelectedStory(sale);
		setStoryViewerVisible(true);
	}, []);

	const handleCloseStory = useCallback(() => {
		setStoryViewerVisible(false);
		setSelectedStory(null);
	}, []);

	const handleGetDirections = useCallback((sale: SaleWithDistance) => {
		const { latitude, longitude, address } = sale.location;
		const appleMapsUrl = `http://maps.apple.com/?daddr=${latitude},${longitude}`;
		const googleMapsUrl = `https://maps.google.com/maps?daddr=${latitude},${longitude}`;

		if (Platform.OS === "ios") {
			ActionSheetIOS.showActionSheetWithOptions(
				{
					options: ["Apple Maps", "Google Maps", "Cancel"],
					cancelButtonIndex: 2,
				},
				(index) => {
					if (index === 0) Linking.openURL(appleMapsUrl);
					else if (index === 1) Linking.openURL(googleMapsUrl);
				}
			);
		} else {
			Linking.openURL(googleMapsUrl);
		}
	}, []);

	// MAP MODE: full-screen map with UI floating on top
	if (mode === "map") {
		return (
			<View style={styles.safe}>
				{/* Full-screen map behind everything */}
				<MapView
					provider={PROVIDER_GOOGLE}
					style={StyleSheet.absoluteFill}
					region={mapRegion}
					showsUserLocation={true}
					showsMyLocationButton={true}
					onPress={() => setSelectedMarker(null)}
				>
					{salesWithDistance.map((s) => (
						<Marker
							key={s.id}
							coordinate={{
								latitude: s.location.latitude,
								longitude: s.location.longitude,
							}}
							onPress={() => setSelectedMarker(s)}
						/>
					))}
				</MapView>

				{/* Header with theme background */}
				<View style={[styles.mapHeaderStrip, { backgroundColor: theme.background }]}>
					<SafeAreaView>
						<HeaderBar mode={mode} onToggleMode={setMode} />
					</SafeAreaView>
				</View>

				{/* Bottom card when marker is selected */}
				{selectedMarker && (
					<View style={styles.markerCard}>
						{(selectedMarker.images?.[0] || selectedMarker.videoUrl) && (
							<Image
								source={{ uri: selectedMarker.images?.[0] || selectedMarker.videoUrl }}
								style={styles.markerCardImage}
								resizeMode="cover"
							/>
						)}
						<View style={styles.markerCardBody}>
							<Text style={styles.markerCardTitle} numberOfLines={1}>
								{selectedMarker.title}
							</Text>
							<Text style={styles.markerCardAddress} numberOfLines={1}>
								{selectedMarker.location.address}
							</Text>
							{selectedMarker._distanceText ? (
								<Text style={styles.markerCardDistance}>
									{selectedMarker._distanceText} away
								</Text>
							) : null}
							<View style={styles.markerCardButtons}>
								<TouchableOpacity
									style={styles.markerCardButtonPrimary}
									onPress={() => router.push(`/sale-detail/${selectedMarker.id}`)}
									activeOpacity={0.8}
								>
									<Text style={styles.markerCardButtonPrimaryText}>View Detail</Text>
								</TouchableOpacity>
								<TouchableOpacity
									style={styles.markerCardButtonSecondary}
									onPress={() => handleGetDirections(selectedMarker)}
									activeOpacity={0.8}
								>
									<Text style={styles.markerCardButtonSecondaryText}>Get Directions</Text>
								</TouchableOpacity>
							</View>
						</View>
					</View>
				)}

				<StoryViewer
					visible={storyViewerVisible}
					sale={selectedStory}
					onClose={handleCloseStory}
				/>
			</View>
		);
	}

	// LIST MODE: standard scrollable layout
	return (
		<SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
			<GradientBackground />
			<HeaderBar mode={mode} onToggleMode={setMode} />

			<View style={styles.content}>
				<Text style={[styles.title, { color: theme.text }]}>Discover</Text>

				{!loading && (
					<StoriesBar sales={salesWithDistance} onStoryPress={handleStoryPress} />
				)}

				{loading ? (
					<View style={styles.loaderWrap}>
						<ActivityIndicator color={theme.tint} />
					</View>
				) : (
					<FlatList
						data={salesWithDistance}
						keyExtractor={(item) => item.id}
						contentContainerStyle={{
							paddingBottom: 120,
							flexGrow: 1,
						}}
						renderItem={({ item }) => (
							<SaleCard
								sale={item}
								distanceText={item._distanceText}
								onPress={() => router.push(`/sale-detail/${item.id}`)}
							/>
						)}
						ListEmptyComponent={
							<View style={styles.emptyWrap}>
								<Text style={[styles.emptyText, { color: theme.secondaryText }]}>
									No garage sales nearby yet.
								</Text>
								<Text style={[styles.emptyHint, { color: theme.secondaryText }]}>
									Pull down to refresh or check back later.
								</Text>
							</View>
						}
						showsVerticalScrollIndicator={false}
						refreshControl={
							<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
						}
					/>
				)}
			</View>

			<StoryViewer
				visible={storyViewerVisible}
				sale={selectedStory}
				onClose={handleCloseStory}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1 },
	content: { paddingHorizontal: 18, paddingTop: 6, flex: 1 },

	title: {
		fontSize: 28,
		fontWeight: "900",
		letterSpacing: -0.4,
		marginBottom: 12,
	},

	loaderWrap: { paddingTop: 30 },

	emptyWrap: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingTop: 60,
	},
	emptyText: {
		fontSize: 16,
		fontWeight: "600",
	},
	emptyHint: {
		fontSize: 14,
		marginTop: 6,
	},

	mapOverlay: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
	},
	mapHeaderStrip: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
	},

	markerCard: {
		position: "absolute",
		bottom: 30,
		left: 16,
		right: 16,
		backgroundColor: "#fff",
		borderRadius: 18,
		overflow: "hidden",
		shadowColor: "#000",
		shadowOpacity: 0.15,
		shadowRadius: 12,
		shadowOffset: { width: 0, height: 4 },
		elevation: 6,
	},
	markerCardImage: {
		width: "100%",
		height: 140,
	},
	markerCardBody: {
		padding: 14,
	},
	markerCardTitle: {
		fontSize: 17,
		fontWeight: "700",
		color: "#23201C",
		marginBottom: 4,
	},
	markerCardAddress: {
		fontSize: 13,
		color: "#807A73",
		marginBottom: 4,
	},
	markerCardDistance: {
		fontSize: 13,
		fontWeight: "600",
		color: "#DF6B4F",
		marginBottom: 12,
	},
	markerCardButtons: {
		flexDirection: "row",
		gap: 10,
	},
	markerCardButtonPrimary: {
		flex: 1,
		backgroundColor: "#DF6B4F",
		borderRadius: 12,
		paddingVertical: 12,
		alignItems: "center",
	},
	markerCardButtonPrimaryText: {
		color: "#fff",
		fontSize: 14,
		fontWeight: "700",
	},
	markerCardButtonSecondary: {
		flex: 1,
		backgroundColor: "#F1EDE8",
		borderRadius: 12,
		paddingVertical: 12,
		alignItems: "center",
	},
	markerCardButtonSecondaryText: {
		color: "#23201C",
		fontSize: 14,
		fontWeight: "700",
	},
});
