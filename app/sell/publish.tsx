import { IconSymbol } from "@/components/ui/icon-symbol";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
	Alert,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

function formatAddress(p: Location.LocationGeocodedAddress | undefined) {
	if (!p) return "";
	const parts = [p.streetNumber, p.street, p.city, p.region].filter(Boolean);
	return parts.join(", ");
}

export default function ReviewPublish() {
	const params = useLocalSearchParams<{ videoUri?: string; mode?: string }>();
	const videoUri = params.videoUri || "";

	const [addressLine, setAddressLine] = useState<string>(
		"Fetching location..."
	);
	const [photos, setPhotos] = useState<string[]>([]);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [categories, setCategories] = useState([
		"Furniture",
		"Electronics",
		"Books",
		"Clothing",
	]);

	useEffect(() => {
		(async () => {
			try {
				const perm = await Location.requestForegroundPermissionsAsync();
				if (perm.status !== "granted") return;

				const pos = await Location.getCurrentPositionAsync({});
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
			"Ready to publish! Next step is wiring this to your backend.",
			[{ text: "OK", onPress: () => router.back() }]
		);
	};

	return (
		<View style={styles.safe}>
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
					<IconSymbol size={24} name="chevron.left" color="#1F1F1F" />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Review & Publish</Text>
				<View style={styles.placeholder} />
			</View>

			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				{/* Video Preview */}
				<View style={styles.videoBox}>
					<IconSymbol size={48} name="video" color="#9A928A" />
					<Text style={styles.videoCaption}>Video preview</Text>
				</View>

				{/* AI Detected Items */}
				<View style={styles.card}>
					<View style={styles.cardHeader}>
						<IconSymbol size={20} name="tag" color="#D97B3F" />
						<Text style={styles.cardTitle}>AI Detected Items</Text>
					</View>

					<View style={styles.chipRow}>
						{categories.map((cat) => (
							<View key={cat} style={styles.chip}>
								<Text style={styles.chipText}>{cat}</Text>
							</View>
						))}
					</View>
				</View>

				{/* Location */}
				<View style={styles.card}>
					<View style={styles.cardHeader}>
						<IconSymbol size={20} name="location.fill" color="#D97B3F" />
						<Text style={styles.cardTitle}>Location</Text>
					</View>
					<Text style={styles.locationText}>{addressLine}</Text>
				</View>

				{/* Upload Photos */}
				<TouchableOpacity
					style={styles.dashedUpload}
					onPress={onUploadPhotos}
					activeOpacity={0.8}
				>
					<IconSymbol size={24} name="square.and.arrow.up" color="#D97B3F" />
					<Text style={styles.dashedText}>Upload Additional Photos</Text>
				</TouchableOpacity>

				{/* Publish Button */}
				<TouchableOpacity
					style={styles.publishBtn}
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
	safe: { flex: 1, backgroundColor: "#FAF7F2" },

	header: {
		paddingTop: 60,
		paddingBottom: 16,
		paddingHorizontal: 20,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		backgroundColor: "#FAF7F2",
		borderBottomWidth: 1,
		borderBottomColor: "#E6E1DA",
	},
	backBtn: {
		width: 40,
		height: 40,
		alignItems: "center",
		justifyContent: "center",
	},
	headerTitle: { fontSize: 20, fontWeight: "700", color: "#1F1F1F" },
	placeholder: { width: 40 },

	content: { paddingHorizontal: 18, paddingTop: 20 },

	videoBox: {
		height: 200,
		borderRadius: 18,
		backgroundColor: "#F1EDE6",
		borderWidth: 1,
		borderColor: "#E6E1DA",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 12,
	},
	videoCaption: {
		marginTop: 12,
		fontSize: 15,
		fontWeight: "600",
		color: "#6F6A64",
	},

	card: {
		backgroundColor: "#FFF",
		borderWidth: 1,
		borderColor: "#E6E1DA",
		borderRadius: 18,
		padding: 18,
		marginBottom: 14,
	},
	cardHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		marginBottom: 14,
	},
	cardTitle: { fontSize: 18, fontWeight: "700", color: "#1F1F1F" },

	chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
	chip: {
		paddingVertical: 10,
		paddingHorizontal: 16,
		borderRadius: 20,
		backgroundColor: "#F1EDE6",
		borderWidth: 1,
		borderColor: "#E6E1DA",
	},
	chipText: { fontSize: 15, fontWeight: "600", color: "#1F1F1F" },

	locationText: {
		fontSize: 15,
		fontWeight: "500",
		color: "#6F6A64",
		lineHeight: 22,
	},

	dashedUpload: {
		height: 60,
		borderRadius: 18,
		borderWidth: 2,
		borderStyle: "dashed",
		borderColor: "#D97B3F",
		backgroundColor: "#FFF",
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "row",
		gap: 10,
		marginTop: 10,
		marginBottom: 20,
	},
	dashedText: { fontSize: 16, fontWeight: "700", color: "#D97B3F" },

	publishBtn: {
		height: 56,
		borderRadius: 28,
		backgroundColor: "#D97B3F",
		alignItems: "center",
		justifyContent: "center",
		marginTop: 10,
	},
	publishText: { color: "#FFF", fontSize: 18, fontWeight: "700" },
});
