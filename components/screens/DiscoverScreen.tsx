// components/screens/DiscoverScreen.tsx
import { useFocusEffect } from "@react-navigation/native";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	RefreshControl,
	SafeAreaView,
	StyleSheet,
	Text,
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
		} catch (e) {
			console.error("Discover loadSales error:", e);
			setAddressLine((prev) => prev || "Location unavailable");
			try {
				const list = await garageSaleService.getAllGarageSales();
				setSales(list);
			} catch (err) {
				console.error("Failed to load sales fallback:", err);
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
				>
					{salesWithDistance.map((s) => (
						<Marker
							key={s.id}
							coordinate={{
								latitude: s.location.latitude,
								longitude: s.location.longitude,
							}}
							title={s.title}
							description={s.location.address}
						/>
					))}
				</MapView>

				{/* Header with white background */}
				<View style={styles.mapHeaderStrip}>
					<SafeAreaView>
						<HeaderBar mode={mode} onToggleMode={setMode} />
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
		backgroundColor: "#FFFFFF",
	},
});
