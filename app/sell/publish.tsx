import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
	Alert,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

function formatAddress(p: Location.LocationGeocodedAddress | undefined) {
	if (!p) return "";
	const parts = [p.streetNumber, p.street, p.city, p.region].filter(Boolean);
	return parts.join(" ");
}

export default function ReviewPublish() {
	const colorScheme = useColorScheme();
	const theme = Colors[colorScheme ?? "light"];

	const params = useLocalSearchParams<{ videoUri?: string; mode?: string }>();
	const videoUri = params.videoUri || "";

	const [addressLine, setAddressLine] = useState<string>(
		"Fetching location..."
	);
	const [photos, setPhotos] = useState<string[]>([]);

	useEffect(() => {
		(async () => {
			try {
				const perm = await Location.requestForegroundPermissionsAsync();
				if (perm.status !== "granted") return;

				const pos = await Location.getCurrentPositionAsync({
					accuracy: Location.Accuracy.High,
				});
				const loc = {
					latitude: pos.coords.latitude,
					longitude: pos.coords.longitude,
				};
				const geos = await Location.reverseGeocodeAsync(loc);
				setAddressLine(formatAddress(geos?.[0]) || "Your location");
			} catch {
				setAddressLine("Your location");
			}
		})();
	}, []);

	const onUploadPhotos = async () => {
		const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (!perm.granted) {
			Alert.alert(
				"Photos Permission",
				"Please allow photo access to upload images."
			);
			return;
		}

		const res = await ImagePicker.launchImageLibraryAsync({
			allowsMultipleSelection: true,
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			quality: 0.9,
		});

		if (!res.canceled) {
			const uris = res.assets.map((a) => a.uri);
			setPhotos((prev) => [...prev, ...uris]);
		}
	};

	const onPublish = () => {
		Alert.alert(
			"Publish Sale",
			"UI is now matching the target screenshot. Next step is wiring this button to your existing publish logic."
		);
	};

	return (
		<View style={[styles.safe, { backgroundColor: theme.background }]}>
			<View style={styles.header}>
				<Text style={[styles.headerTitle, { color: theme.text }]}>
					Review & Publish
				</Text>
			</View>

			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<View
					style={[
						styles.videoBox,
						{ backgroundColor: theme.muted, borderColor: theme.border },
					]}
				>
					<IconSymbol size={34} name="video" color={theme.secondaryText} />
				</View>
				<Text style={[styles.caption, { color: theme.secondaryText }]}>
					Video preview
				</Text>

				<View
					style={[
						styles.card,
						{ backgroundColor: theme.card, borderColor: theme.border },
					]}
				>
					<View style={styles.cardTitleRow}>
						<IconSymbol size={20} name="tag" color={theme.tint} />
						<Text style={[styles.cardTitle, { color: theme.text }]}>
							AI Detected Items
						</Text>
					</View>

					<View style={styles.chipRow}>
						{["Furniture", "Electronics", "Books", "Clothing"].map((x) => (
							<View
								key={x}
								style={[
									styles.chip,
									{ backgroundColor: theme.muted, borderColor: theme.border },
								]}
							>
								<Text style={[styles.chipText, { color: theme.text }]}>
									{x}
								</Text>
							</View>
						))}
					</View>
				</View>

				<View
					style={[
						styles.card,
						{ backgroundColor: theme.card, borderColor: theme.border },
					]}
				>
					<View style={styles.cardTitleRow}>
						<IconSymbol size={20} name="location.fill" color={theme.tint} />
						<Text style={[styles.cardTitle, { color: theme.text }]}>
							Location
						</Text>
					</View>
					<Text style={[styles.locationText, { color: theme.secondaryText }]}>
						{addressLine}
					</Text>
				</View>

				<TouchableOpacity
					style={[styles.dashedUpload, { borderColor: theme.tint }]}
					onPress={onUploadPhotos}
					activeOpacity={0.9}
				>
					<IconSymbol size={22} name="square.and.arrow.up" color={theme.tint} />
					<Text style={[styles.dashedText, { color: theme.tint }]}>
						Upload Additional Photos
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[styles.publishBtn, { backgroundColor: theme.tint }]}
					onPress={onPublish}
					activeOpacity={0.92}
				>
					<Text style={styles.publishText}>Publish Sale</Text>
				</TouchableOpacity>

				<View style={{ height: 120 }} />
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1 },

	header: {
		paddingTop: 18,
		paddingBottom: 14,
		alignItems: "center",
		borderBottomWidth: 1,
		borderBottomColor: "#E6E1DA",
	},
	headerTitle: { fontSize: 20, fontWeight: "900" },

	content: { paddingHorizontal: 18, paddingTop: 18 },

	videoBox: {
		height: 220,
		borderRadius: 18,
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	caption: { marginTop: 10, marginBottom: 16, fontSize: 16, fontWeight: "700" },

	card: {
		borderWidth: 1,
		borderRadius: 18,
		padding: 16,
		marginBottom: 14,
	},
	cardTitleRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		marginBottom: 12,
	},
	cardTitle: { fontSize: 20, fontWeight: "900" },

	chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
	chip: {
		paddingVertical: 10,
		paddingHorizontal: 14,
		borderRadius: 999,
		borderWidth: 1,
	},
	chipText: { fontSize: 15, fontWeight: "800" },

	locationText: { fontSize: 16, fontWeight: "700", lineHeight: 22 },

	dashedUpload: {
		height: 66,
		borderRadius: 18,
		borderWidth: 2,
		borderStyle: "dashed",
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "row",
		gap: 12,
		marginTop: 10,
	},
	dashedText: { fontSize: 18, fontWeight: "900" },

	publishBtn: {
		height: 66,
		borderRadius: 999,
		alignItems: "center",
		justifyContent: "center",
		marginTop: 18,
	},
	publishText: { color: "#fff", fontSize: 20, fontWeight: "900" },
});
