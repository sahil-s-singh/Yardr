import GradientBackground from "@/components/ui/GradientBackground";
import { garageSaleService } from "@/services/garageSaleService";
import { recheckSaleAgainstWishlists } from "@/services/matchUpdateService";
import { GarageSale } from "@/types/garageSale";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
	Alert,
	KeyboardAvoidingView,
	Platform,
	SafeAreaView,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

export default function EditSaleScreen() {
	const { id } = useLocalSearchParams();
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [sale, setSale] = useState<GarageSale | null>(null);

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [address, setAddress] = useState("");
	const [date, setDate] = useState("");
	const [startTime, setStartTime] = useState("");
	const [endTime, setEndTime] = useState("");
	const [contactName, setContactName] = useState("");
	const [contactPhone, setContactPhone] = useState("");
	const [contactEmail, setContactEmail] = useState("");

	useEffect(() => {
		loadSale();
	}, [id]);

	const loadSale = async () => {
		try {
			const saleData = await garageSaleService.getGarageSaleById(id as string);
			if (saleData) {
				setSale(saleData);
				setTitle(saleData.title);
				setDescription(saleData.description);
				setAddress(saleData.location?.address || "");
				setDate(saleData.date);
				setStartTime(saleData.startTime);
				setEndTime(saleData.endTime);
				setContactName(saleData.contactName);
				setContactPhone(saleData.contactPhone || "");
				setContactEmail(saleData.contactEmail || "");
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

	const handleDelete = () => {
		Alert.alert(
			"Delete Sale",
			"Are you sure you want to delete this garage sale?",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						try {
							await garageSaleService.deleteGarageSale(id as string);
							Alert.alert("Success", "Garage sale deleted", [
								{ text: "OK", onPress: () => router.push("/my-sales") },
							]);
						} catch (error) {
							Alert.alert("Error", "Failed to delete garage sale");
						}
					},
				},
			]
		);
	};

	const handleSave = async () => {
		if (!title.trim() || !description.trim() || !contactName.trim()) {
			Alert.alert("Error", "Please fill in all required fields");
			return;
		}

		setSaving(true);
		try {
			await garageSaleService.updateGarageSale(id as string, {
				title: title.trim(),
				description: description.trim(),
				contactName: contactName.trim(),
				contactPhone: contactPhone.trim() || undefined,
				contactEmail: contactEmail.trim() || undefined,
			});

			// Re-check against wishlists since title/description may have changed
			recheckSaleAgainstWishlists(id as string).catch((err) =>
				console.error("Wishlist recheck failed:", err)
			);

			Alert.alert("Success", "Garage sale updated successfully!", [
				{ text: "OK", onPress: () => router.back() },
			]);
		} catch (error) {
			console.error("Error updating sale:", error);
			Alert.alert("Error", "Failed to update garage sale");
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<SafeAreaView style={styles.safe}>
				<GradientBackground />
				<Text style={styles.loadingText}>Loading...</Text>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.safe}>
			<GradientBackground />
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				style={{ flex: 1 }}
			>
				{/* Header */}
				<View style={styles.header}>
					<TouchableOpacity onPress={() => router.back()}>
						<Text style={styles.backChevron}>{"\u2039"}</Text>
					</TouchableOpacity>
					<Text style={styles.headerTitle}>Edit Sale</Text>
					<TouchableOpacity onPress={handleDelete}>
						<MaterialIcons name="delete-outline" size={24} color="#E05244" />
					</TouchableOpacity>
				</View>

				<ScrollView
					contentContainerStyle={styles.content}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled"
				>
					{/* Sale Details */}
					<Text style={styles.sectionTitle}>Sale Details</Text>

					<Text style={styles.label}>Title *</Text>
					<TextInput
						style={styles.glassInput}
						value={title}
						onChangeText={setTitle}
						placeholder="Sale title"
						placeholderTextColor="#807A73"
						editable={!saving}
					/>

					<Text style={styles.label}>Description *</Text>
					<TextInput
						style={[styles.glassInput, styles.textArea]}
						value={description}
						onChangeText={setDescription}
						placeholder="What are you selling?"
						placeholderTextColor="#807A73"
						multiline
						editable={!saving}
					/>

					<Text style={styles.label}>Address</Text>
					<TextInput
						style={[styles.glassInput, styles.disabledInput]}
						value={address}
						editable={false}
					/>
					<Text style={styles.hint}>Cannot be changed after creation</Text>

					{/* Schedule */}
					<Text style={[styles.sectionTitle, { marginTop: 20 }]}>
						Schedule
					</Text>

					<View style={styles.row}>
						<View style={{ flex: 1 }}>
							<Text style={styles.label}>Date</Text>
							<TextInput
								style={[styles.glassInput, styles.disabledInput]}
								value={date}
								editable={false}
							/>
						</View>
					</View>

					<View style={styles.row}>
						<View style={{ flex: 1 }}>
							<Text style={styles.label}>Start</Text>
							<TextInput
								style={[styles.glassInput, styles.disabledInput]}
								value={startTime}
								editable={false}
							/>
						</View>
						<View style={{ flex: 1 }}>
							<Text style={styles.label}>End</Text>
							<TextInput
								style={[styles.glassInput, styles.disabledInput]}
								value={endTime}
								editable={false}
							/>
						</View>
					</View>

					{/* Contact */}
					<Text style={[styles.sectionTitle, { marginTop: 20 }]}>
						Contact Info
					</Text>

					<Text style={styles.label}>Name *</Text>
					<TextInput
						style={styles.glassInput}
						value={contactName}
						onChangeText={setContactName}
						placeholder="Your name"
						placeholderTextColor="#807A73"
						editable={!saving}
					/>

					<Text style={styles.label}>Phone</Text>
					<TextInput
						style={styles.glassInput}
						value={contactPhone}
						onChangeText={setContactPhone}
						placeholder="(555) 123-4567"
						placeholderTextColor="#807A73"
						keyboardType="phone-pad"
						editable={!saving}
					/>

					<Text style={styles.label}>Email</Text>
					<TextInput
						style={styles.glassInput}
						value={contactEmail}
						onChangeText={setContactEmail}
						placeholder="your@email.com"
						placeholderTextColor="#807A73"
						keyboardType="email-address"
						autoCapitalize="none"
						editable={!saving}
					/>

					{/* Save Button */}
					<TouchableOpacity
						onPress={handleSave}
						disabled={saving}
						activeOpacity={0.9}
						style={{ marginTop: 24 }}
					>
						<LinearGradient
							colors={["#DF6B4F", "#F9AD85"]}
							start={{ x: 0, y: 0.5 }}
							end={{ x: 1, y: 0.5 }}
							style={[styles.saveBtn, saving && { opacity: 0.5 }]}
						>
							<Text style={styles.saveBtnText}>
								{saving ? "Saving..." : "Save Changes"}
							</Text>
						</LinearGradient>
					</TouchableOpacity>

					<View style={{ height: 40 }} />
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: "#F7F6F4" },

	header: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 8,
	},
	backChevron: {
		fontSize: 28,
		fontWeight: "700",
		color: "#23201C",
	},
	headerTitle: {
		flex: 1,
		textAlign: "center",
		fontSize: 18,
		fontWeight: "700",
		color: "#23201C",
	},

	content: {
		paddingHorizontal: 20,
		paddingTop: 8,
	},
	loadingText: {
		textAlign: "center",
		marginTop: 50,
		fontSize: 16,
		color: "#807A73",
	},

	sectionTitle: {
		fontSize: 16,
		fontWeight: "800",
		color: "#23201C",
		marginBottom: 12,
	},
	label: {
		fontSize: 14,
		fontWeight: "600",
		color: "#23201C",
		marginBottom: 8,
		marginTop: 12,
	},
	glassInput: {
		backgroundColor: "rgba(255,255,255,0.5)",
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.3)",
		borderRadius: 16,
		paddingHorizontal: 16,
		paddingVertical: 14,
		fontSize: 15,
		color: "#23201C",
	},
	textArea: {
		minHeight: 90,
		textAlignVertical: "top",
	},
	disabledInput: {
		opacity: 0.6,
	},
	hint: {
		fontSize: 12,
		color: "#807A73",
		marginTop: 4,
		fontStyle: "italic",
	},
	row: {
		flexDirection: "row",
		gap: 12,
	},

	saveBtn: {
		borderRadius: 18,
		paddingVertical: 16,
		alignItems: "center",
		shadowColor: "#DF6B4F",
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.3,
		shadowRadius: 18,
		elevation: 6,
	},
	saveBtnText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "700",
	},
});
