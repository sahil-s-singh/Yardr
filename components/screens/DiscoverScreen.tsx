// components/screens/DiscoverScreen.tsx
import { useFocusEffect } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Image,
	RefreshControl,
	SafeAreaView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import MapView, { Callout, Marker, Region } from "react-native-maps";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { garageSaleService } from "@/services/garageSaleService";
import { GarageSale } from "@/types/garageSale";

import GradientBackground from "@/components/ui/GradientBackground";
import HeaderBar from "@/components/ui/HeaderBar";
import RadiusSlider from "@/components/ui/RadiusSlider";
import SaleCard from "@/components/ui/SaleCard";
import StoriesBar from "@/components/ui/StoriesBar";
import StoryViewer from "@/components/ui/StoryViewer";

type Mode = "list" | "map";

type SaleWithDistance = GarageSale & {
	_distanceKm: number;
	_distanceText: string;
};

const DEFAULT_RADIUS_KM = 25;
const MIN_RADIUS_KM = 1;
const MAX_RADIUS_KM = 160;

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
	const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
	const [committedRadius, setCommittedRadius] = useState(DEFAULT_RADIUS_KM);
	const debounceRef = useRef<NodeJS.Timeout | null>(null);

	const handleRadiusChange = useCallback((val: number) => {
		setRadiusKm(val);
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => setCommittedRadius(val), 400);
	}, []);

	const [userLoc, setUserLoc] = useState<{
		latitude: number;
		longitude: number;
	} | null>(null);
	const [addressLine, setAddressLine] = useState("");
	const [sales, setSales] = useState<GarageSale[]>([]);

	const [selectedStory, setSelectedStory] = useState<GarageSale | null>(null);
	const [storyViewerVisible, setStoryViewerVisible] = useState(false);

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
				loc.longitude,
				committedRadius
			);
			setSales(list);
		} catch (e) {
			console.error("Discover loadSales error:", e);
			setAddressLine((prev) => prev || "Location unavailable");
		} finally {
			setLoading(false);
		}
	}, [committedRadius]);

	useFocusEffect(
		useCallback(() => {
			loadSales();
		}, [loadSales])
	);

	// Reload when user finishes adjusting the radius
	const isInitial = useRef(true);
	useEffect(() => {
		if (isInitial.current) {
			isInitial.current = false;
			return;
		}
		if (userLoc) loadSales();
	}, [committedRadius]);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		try {
			await loadSales();
		} finally {
			setRefreshing(false);
		}
	}, [loadSales]);

	const salesWithDistance: SaleWithDistance[] = useMemo(() => {
		if (!userLoc) return sales.map((s) => ({ ...s, _distanceKm: 0, _distanceText: "" }));

		return sales
			.map((s) => {
				const km = haversineKm(userLoc, s.location);
				const distanceText =
					km >= 1
						? `${Math.round(km)} km`
						: `${Math.round(km * 1000)} m`;
				return { ...s, _distanceKm: km, _distanceText: distanceText };
			})
			.sort((a, b) => a._distanceKm - b._distanceKm);
	}, [sales, userLoc]);

	// ~1 degree latitude = 111 km. Add a bit of padding (×2.2) so the circle fits.
	const radiusDelta = (committedRadius / 111) * 2.2;

	const mapRegion: Region = useMemo(() => {
		const lat = userLoc?.latitude ?? 43.4516;
		const lng = userLoc?.longitude ?? -80.4925;
		return {
			latitude: lat,
			longitude: lng,
			latitudeDelta: radiusDelta,
			longitudeDelta: radiusDelta,
		};
	}, [userLoc, radiusDelta]);

	const mapRef = useRef<MapView>(null);

	// Animate the map when radius changes
	useEffect(() => {
		if (!userLoc || mode !== "map") return;
		mapRef.current?.animateToRegion(
			{
				latitude: userLoc.latitude,
				longitude: userLoc.longitude,
				latitudeDelta: radiusDelta,
				longitudeDelta: radiusDelta,
			},
			300
		);
	}, [committedRadius]);

	const handleStoryPress = useCallback((sale: GarageSale) => {
		setSelectedStory(sale);
		setStoryViewerVisible(true);
	}, []);

	const handleCloseStory = useCallback(() => {
		setStoryViewerVisible(false);
		setSelectedStory(null);
	}, []);

	const sliderEl = userLoc ? (
		<RadiusSlider
			min={MIN_RADIUS_KM}
			max={MAX_RADIUS_KM}
			value={radiusKm}
			onValueChange={handleRadiusChange}
			trackColor={theme.border}
		/>
	) : null;

	// MAP MODE: full-screen map with UI floating on top
	if (mode === "map") {
		return (
			<View style={styles.safe}>
				{/* Full-screen map behind everything */}
				<MapView
					ref={mapRef}
					provider="google"
					style={StyleSheet.absoluteFill}
					initialRegion={mapRegion}
					showsUserLocation={true}
					showsMyLocationButton={true}
				>
					{salesWithDistance.map((s) => (
						<Marker
							key={s.id}
							coordinate={{
								latitude: s.location.latitude,
								longitude: s.location.longitude,
							}}
						>
							<Callout
								onPress={() => router.push(`/sale-detail/${s.id}`)}
							>
								<View style={styles.callout}>
									{s.images?.[0] ? (
										<View>
											<Image
												source={{ uri: s.images[0] }}
												style={styles.calloutImage}
												resizeMode="cover"
											/>
											{s.videoUrl ? (
												<View style={styles.calloutPlayBadge}>
													<MaterialIcons name="play-arrow" size={16} color="#fff" />
												</View>
											) : null}
										</View>
									) : (
										<View style={styles.calloutImagePlaceholder}>
											<MaterialIcons
												name={s.videoUrl ? "videocam" : "storefront"}
												size={24}
												color="#807A73"
											/>
										</View>
									)}
									<Text style={styles.calloutTitle} numberOfLines={1}>
										{s.title}
									</Text>
									<View style={styles.calloutRow}>
										<MaterialIcons name="location-on" size={12} color="#DF6B4F" />
										<Text style={styles.calloutAddress} numberOfLines={1}>
											{s.location.address}
										</Text>
									</View>
									{s._distanceText ? (
										<View style={styles.calloutRow}>
											<MaterialIcons name="directions-walk" size={12} color="#6BAA8E" />
											<Text style={styles.calloutDistance}>{s._distanceText} away</Text>
										</View>
									) : null}
									<View style={styles.calloutCta}>
										<Text style={styles.calloutCtaText}>View Details →</Text>
									</View>
								</View>
							</Callout>
						</Marker>
					))}
				</MapView>

				{/* Header with white background */}
				<View style={styles.mapHeaderStrip}>
					<SafeAreaView>
						<HeaderBar mode={mode} onToggleMode={setMode} />
						<View style={styles.titleRowMap}>
							<Text style={[styles.title, { color: theme.text }]}>Discover</Text>
							{sliderEl && <View style={styles.sliderInline}>{sliderEl}</View>}
						</View>
					</SafeAreaView>
				</View>

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
				<View style={styles.titleRow}>
					<Text style={[styles.title, { color: theme.text }]}>Discover</Text>
					{sliderEl && <View style={styles.sliderInline}>{sliderEl}</View>}
				</View>


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
									No garage sales within {radiusKm} km.
								</Text>
								<Text style={[styles.emptyHint, { color: theme.secondaryText }]}>
									Try increasing the distance or pull down to refresh.
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

	titleRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 10,
		gap: 14,
	},
	titleRowMap: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 18,
		paddingBottom: 8,
		gap: 14,
	},
	title: {
		fontSize: 28,
		fontWeight: "900",
		letterSpacing: -0.4,
	},
	sliderInline: {
		flex: 1,
		paddingTop: 2,
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
		backgroundColor: "#FFFFFF",
	},

	callout: {
		width: 220,
		padding: 12,
	},
	calloutImage: {
		width: "100%",
		height: 100,
		borderRadius: 10,
		marginBottom: 8,
	},
	calloutPlayBadge: {
		position: "absolute",
		top: 6,
		right: 6,
		width: 26,
		height: 26,
		borderRadius: 13,
		backgroundColor: "rgba(0,0,0,0.5)",
		alignItems: "center",
		justifyContent: "center",
	},
	calloutImagePlaceholder: {
		width: "100%",
		height: 100,
		borderRadius: 10,
		backgroundColor: "#F1EDE8",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 8,
	},
	calloutTitle: {
		fontSize: 15,
		fontWeight: "800",
		color: "#23201C",
		marginBottom: 6,
	},
	calloutRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		marginBottom: 3,
	},
	calloutAddress: {
		fontSize: 12,
		color: "#807A73",
		flex: 1,
	},
	calloutDistance: {
		fontSize: 12,
		fontWeight: "600",
		color: "#6BAA8E",
	},
	calloutCta: {
		marginTop: 8,
		backgroundColor: "#DF6B4F",
		borderRadius: 8,
		paddingVertical: 6,
		alignItems: "center",
	},
	calloutCtaText: {
		color: "#fff",
		fontSize: 12,
		fontWeight: "700",
	},
});
