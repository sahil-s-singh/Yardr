import { garageSaleService } from "@/services/garageSaleService";
import { GarageSale } from "@/types/garageSale";
import { MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
	Alert,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditSaleScreen() {
	const { id } = useLocalSearchParams();
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [sale, setSale] = useState<GarageSale | null>(null);

	// Form state
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
			<SafeAreaView style={styles.safeArea}>
				<View style={styles.container}>
					<View style={styles.content}>
						<Text style={styles.loadingText}>Loading... </Text>
					</View>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.safeArea}>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				style={styles.container}
				keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
			>
				{/* Header */}
				<View style={styles.header}>
					<TouchableOpacity
						onPress={() => router.back()}
						style={styles.headerButton}
					>
						<MaterialIcons name="arrow-back" size={24} color="#000" />
					</TouchableOpacity>
					<View style={styles.headerTitleContainer}>
						<Text style={styles.headerTitle}>Edit Sale</Text>
					</View>
					<TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
						<MaterialIcons name="delete" size={24} color="#FF3B30" />
					</TouchableOpacity>
				</View>

				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={true}
					keyboardShouldPersistTaps="handled"
				>
					<View style={styles.content}>
						{/* Sale Details Section */}
						<View style={styles.section}>
							<Text style={styles.sectionTitle}>Sale Details</Text>
							<View style={styles.card}>
								<View style={styles.fieldGroup}>
									<Text style={styles.label}>Title *</Text>
									<TextInput
										style={styles.input}
										placeholder="Multi-Family Garage Sale"
										placeholderTextColor="#999"
										value={title}
										onChangeText={setTitle}
										editable={!saving}
									/>
								</View>

								<View style={styles.fieldGroup}>
									<Text style={styles.label}>Description *</Text>
									<TextInput
										style={[styles.input, styles.textArea]}
										placeholder="Furniture, electronics, books, and household items"
										placeholderTextColor="#999"
										value={description}
										onChangeText={setDescription}
										multiline
										numberOfLines={4}
										editable={!saving}
									/>
								</View>

								<View style={styles.fieldGroup}>
									<Text style={styles.label}>Address *</Text>
									<View style={styles.inputWithIcon}>
										<MaterialIcons
											name="location-on"
											size={20}
											color="#FF9500"
										/>
										<TextInput
											style={[styles.input, styles.inputWithIconText]}
											placeholder="1234 Oak Street, Maplewood"
											placeholderTextColor="#999"
											value={address}
											editable={false}
										/>
									</View>
									<Text style={styles.infoText}>
										Address cannot be changed after creation
									</Text>
								</View>
							</View>
						</View>

						{/* Schedule Section */}
						<View style={styles.section}>
							<View style={styles.scheduleHeader}>
								<MaterialIcons
									name="calendar-today"
									size={20}
									color="#FF9500"
								/>
								<Text style={styles.sectionTitle}>Schedule</Text>
							</View>
							<View style={styles.card}>
								<View style={styles.fieldGroup}>
									<Text style={styles.label}>Date *</Text>
									<View style={styles.inputWithIcon}>
										<MaterialIcons name="event" size={20} color="#FF9500" />
										<TextInput
											style={[styles.input, styles.inputWithIconText]}
											placeholder="2024-12-21"
											placeholderTextColor="#999"
											value={date}
											editable={false}
										/>
									</View>
									<Text style={styles.infoText}>
										Date cannot be changed after creation
									</Text>
								</View>

								<View style={styles.timeRow}>
									<View style={[styles.fieldGroup, styles.timeField]}>
										<Text style={styles.label}>Start Time</Text>
										<View style={styles.inputWithIcon}>
											<MaterialIcons
												name="schedule"
												size={20}
												color="#FF9500"
											/>
											<TextInput
												style={[styles.input, styles.inputWithIconText]}
												placeholder="08:00 AM"
												placeholderTextColor="#999"
												value={startTime}
												editable={false}
											/>
										</View>
									</View>

									<View style={[styles.fieldGroup, styles.timeField]}>
										<Text style={styles.label}>End Time</Text>
										<View style={styles.inputWithIcon}>
											<MaterialIcons
												name="schedule"
												size={20}
												color="#FF9500"
											/>
											<TextInput
												style={[styles.input, styles.inputWithIconText]}
												placeholder="02:00 PM"
												placeholderTextColor="#999"
												value={endTime}
												editable={false}
											/>
										</View>
									</View>
								</View>
							</View>
						</View>

						{/* Contact Information Section */}
						<View style={styles.section}>
							<Text style={styles.sectionTitle}>Contact Information</Text>
							<View style={styles.card}>
								<View style={styles.fieldGroup}>
									<Text style={styles.label}>Contact Name *</Text>
									<TextInput
										style={styles.input}
										placeholder="Seller"
										placeholderTextColor="#999"
										value={contactName}
										onChangeText={setContactName}
										editable={!saving}
									/>
								</View>

								<View style={styles.fieldGroup}>
									<Text style={styles.label}>Phone Number</Text>
									<View style={styles.inputWithIcon}>
										<MaterialIcons name="phone" size={20} color="#FF9500" />
										<TextInput
											style={[styles.input, styles.inputWithIconText]}
											placeholder="(555) 123-4567"
											placeholderTextColor="#999"
											value={contactPhone}
											onChangeText={setContactPhone}
											keyboardType="phone-pad"
											editable={!saving}
										/>
									</View>
								</View>

								<View style={styles.fieldGroup}>
									<Text style={styles.label}>Email</Text>
									<View style={styles.inputWithIcon}>
										<MaterialIcons name="email" size={20} color="#FF9500" />
										<TextInput
											style={[styles.input, styles.inputWithIconText]}
											placeholder="your@email.com"
											placeholderTextColor="#999"
											value={contactEmail}
											onChangeText={setContactEmail}
											keyboardType="email-address"
											autoCapitalize="none"
											editable={!saving}
										/>
									</View>
								</View>
							</View>
						</View>

						<Text style={styles.note}>
							Note: Date, time, location, and categories cannot be changed after
							creation.
						</Text>
					</View>
				</ScrollView>

				{/* Save Button - Fixed at bottom */}
				<SafeAreaView style={styles.buttonContainer} edges={["bottom"]}>
					<TouchableOpacity
						style={[styles.saveButton, saving && styles.buttonDisabled]}
						onPress={handleSave}
						disabled={saving}
						activeOpacity={0.8}
					>
						<MaterialIcons
							name="check"
							size={20}
							color="#fff"
							style={styles.saveButtonIcon}
						/>
						<Text style={styles.saveButtonText}>
							{saving ? "Saving..." : "Save Changes"}
						</Text>
					</TouchableOpacity>
				</SafeAreaView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: "#f8f8f8",
	},
	container: {
		flex: 1,
		backgroundColor: "#f8f8f8",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingVertical: 12,
		backgroundColor: "#fff",
		borderBottomWidth: 1,
		borderBottomColor: "#e0e0e0",
	},
	headerButton: {
		width: 40,
		height: 40,
		justifyContent: "center",
		alignItems: "center",
	},
	headerTitleContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: "#000",
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		flexGrow: 1,
		paddingBottom: 100,
	},
	content: {
		padding: 16,
	},
	loadingText: {
		textAlign: "center",
		marginTop: 50,
		fontSize: 16,
		color: "#666",
	},

	// Section styles
	section: {
		marginBottom: 24,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: "700",
		color: "#000",
		marginBottom: 12,
	},
	scheduleHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginBottom: 12,
	},
	card: {
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 16,
		borderWidth: 1,
		borderColor: "#f0f0f0",
	},

	// Field styles
	fieldGroup: {
		marginBottom: 16,
	},
	label: {
		fontSize: 14,
		fontWeight: "600",
		marginBottom: 8,
		color: "#333",
	},
	input: {
		borderWidth: 1,
		borderColor: "#e0e0e0",
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 12,
		fontSize: 16,
		backgroundColor: "#fafafa",
		color: "#000",
	},
	textArea: {
		height: 100,
		textAlignVertical: "top",
		paddingTop: 12,
	},
	inputWithIcon: {
		flexDirection: "row",
		alignItems: "center",
		borderWidth: 1,
		borderColor: "#e0e0e0",
		borderRadius: 8,
		paddingHorizontal: 12,
		backgroundColor: "#fafafa",
	},
	inputWithIconText: {
		flex: 1,
		marginLeft: 8,
		borderWidth: 0,
		backgroundColor: "transparent",
	},

	// Time row
	timeRow: {
		flexDirection: "row",
		gap: 10,
	},
	timeField: {
		flex: 1,
	},

	// Info text
	infoText: {
		fontSize: 12,
		color: "#999",
		marginTop: 6,
		fontStyle: "italic",
	},
	note: {
		fontSize: 13,
		color: "#666",
		fontStyle: "italic",
		marginTop: 20,
		marginBottom: 20,
		paddingHorizontal: 4,
	},

	// Button styles
	buttonContainer: {
		backgroundColor: "#f8f8f8",
		paddingTop: 12,
		paddingHorizontal: 16,
		paddingBottom: 16,
		borderTopWidth: 1,
		borderTopColor: "#e0e0e0",
	},
	saveButton: {
		backgroundColor: "#FF9500",
		paddingVertical: 16,
		borderRadius: 12,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		elevation: 4,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.15,
		shadowRadius: 4,
	},
	saveButtonIcon: {
		marginRight: 8,
	},
	saveButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "700",
	},
	buttonDisabled: {
		opacity: 0.6,
	},
});
