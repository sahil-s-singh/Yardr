import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	FlatList,
	SafeAreaView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { garageSaleService } from "@/services/garageSaleService";
import { GarageSale } from "@/types/garageSale";

import FloatingActionButton from "@/components/ui/FloatingActionButton";
import HeaderBar from "@/components/ui/HeaderBar";
import SaleCard from "@/components/ui/SaleCard";
import SegmentedControl from "@/components/ui/SegmentedControl";

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

	const [userLoc, setUserLoc] = useState<{
		latitude: number;
		longitude: number;
	} | null>(null);

	const [addressLine, setAddressLine] = useState("");
	const [sales, setSales] = useState<GarageSale[]>([]);

	useEffect(() => {
		setMode(initialMode);
	}, [initialMode]);

	useEffect(() => {
		(async () => {
			try {
				setLoading(true);

				const perm = await Location.requestForegroundPermissionsAsync();
				if (perm.status !== "granted") {
					Alert.alert(
						"Location Permission",
						"Please enable location to discover nearby sales."
					);
					return;
				}

				// ✅ DO NOT pass Location.Accuracy.High (runtime crash)
				const pos = await Location.getCurrentPositionAsync();

				const loc = {
					latitude: pos.coords.latitude,
					longitude: pos.coords.longitude,
				};

				setUserLoc(loc);

				const geos = await Location.reverseGeocodeAsync(loc);
				setAddressLine(formatAddress(geos?.[0]));

				const list = await garageSaleService.getGarageSalesNearby(
					loc.latitude,
					loc.longitude
				);

				setSales(list);
			} catch (e: any) {
				console.error(e);
				Alert.alert(
					"Error",
					e?.message ?? "Something went wrong loading sales."
				);
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	const salesWithDistance: SaleWithDistance[] = useMemo(() => {
		if (!userLoc) {
			return sales.map((s) => ({ ...s, _distanceText: "" }));
		}

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

	const onPressPlus = () => {
		router.push("/(tabs)/sell/video");
	};

	return (
		<SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
			<HeaderBar />

			<View style={styles.content}>
				<View style={styles.addressRow}>
					<Text style={[styles.addressIcon, { color: theme.secondaryText }]}>
						⌁
					</Text>
					<Text
						numberOfLines={1}
						style={[styles.addressText, { color: theme.secondaryText }]}
					>
						{addressLine || "Fetching your location..."}
					</Text>
				</View>

				<Text style={[styles.title, { color: theme.text }]}>
					Discover Nearby Sales
				</Text>

				<SegmentedControl
					value={mode}
					onChange={setMode}
					leftLabel="List"
					rightLabel="Map"
				/>

				<Text style={[styles.sectionTitle, { color: theme.text }]}>
					✨ Happening Today
				</Text>

				{loading ? (
					<View style={styles.loaderWrap}>
						<ActivityIndicator />
					</View>
				) : mode === "list" ? (
					<FlatList
						data={salesWithDistance}
						keyExtractor={(item) => item.id}
						contentContainerStyle={{ paddingBottom: 120 }}
						renderItem={({ item }) => (
							<SaleCard sale={item} distanceText={item._distanceText} />
						)}
						showsVerticalScrollIndicator={false}
					/>
				) : (
					<View style={styles.mapWrap}>
						<MapView
							provider={PROVIDER_DEFAULT}
							style={StyleSheet.absoluteFill}
							initialRegion={{
								latitude: userLoc?.latitude ?? 43.4516,
								longitude: userLoc?.longitude ?? -80.4925,
								latitudeDelta: 0.06,
								longitudeDelta: 0.06,
							}}
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
					</View>
				)}
			</View>

			<FloatingActionButton onPress={onPressPlus} />
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1 },
	content: { paddingHorizontal: 18, paddingTop: 10, flex: 1 },

	addressRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginTop: 4,
		marginBottom: 8,
	},
	addressIcon: {
		fontSize: 14,
		fontWeight: "700",
		opacity: 0.9,
	},
	addressText: {
		flex: 1,
		fontSize: 14,
		fontWeight: "600",
	},

	title: {
		fontSize: 34,
		fontWeight: "800",
		letterSpacing: -0.4,
		marginBottom: 14,
	},

	sectionTitle: {
		fontSize: 22,
		fontWeight: "800",
		marginTop: 16,
		marginBottom: 12,
	},

	loaderWrap: { paddingTop: 30 },

	mapWrap: {
		height: 520,
		borderRadius: 18,
		overflow: "hidden",
		marginTop: 10,
		borderWidth: 1,
		borderColor: "#E6E1DA",
	},
});
