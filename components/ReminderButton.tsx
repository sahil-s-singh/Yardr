import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useAuth } from "@/contexts/AuthContext";
import {
	showConfirm,
	showError,
	showInfo,
	showSignInPrompt,
	showSuccess,
} from "@/lib/alerts";
import { remindersService } from "@/services/remindersService";

type Variant = "floating" | "inline";

interface ReminderButtonProps {
	garageSaleId: string;
	garageSaleTitle: string;
	garageSaleDate: string; // ISO date string
	size?: number;
	showLabel?: boolean;
	variant?: Variant;
}

const TINT = "#DF6B4F";

export default function ReminderButton({
	garageSaleId,
	garageSaleTitle,
	garageSaleDate,
	size = 24,
	showLabel = false,
	variant = "inline",
}: ReminderButtonProps) {
	const { isAuthenticated, user } = useAuth();
	const [hasReminder, setHasReminder] = useState(false);
	const [loading, setLoading] = useState(false);
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [selectedDate, setSelectedDate] = useState(new Date());

	useEffect(() => {
		if (!isAuthenticated || !user) return;
		remindersService
			.hasReminder(user.id, garageSaleId)
			.then(setHasReminder)
			.catch((err) => console.error("Error checking reminder status:", err));
	}, [isAuthenticated, user, garageSaleId]);

	const handlePress = async () => {
		console.log("[ReminderButton] handlePress", {
			isAuthenticated,
			userId: user?.id,
			loading,
			hasReminder,
			garageSaleId,
		});
		if (!isAuthenticated) {
			console.log("[ReminderButton] not authenticated -> sign in prompt");
			showSignInPrompt(
				router,
				"Please sign in to set reminders for garage sales",
				"Sign In Required",
			);
			return;
		}
		if (!user || loading) {
			console.log("[ReminderButton] no user or already loading, bailing");
			return;
		}

		if (hasReminder) {
			console.log("[ReminderButton] reminder already exists -> remove flow");
			showConfirm(
				"Remove this reminder?",
				async () => {
					setLoading(true);
					try {
						await remindersService.removeReminder(user.id, garageSaleId);
						setHasReminder(false);
						showSuccess("Reminder removed");
					} catch (error: any) {
						console.error("Error removing reminder:", error);
						showError("Failed to remove reminder");
					} finally {
						setLoading(false);
					}
				},
				undefined,
				"Remove Reminder",
			);
			return;
		}

		console.log("[ReminderButton] requesting notification permissions...");
		const hasPermission = await remindersService.requestPermissions();
		console.log("[ReminderButton] permission result:", hasPermission);
		if (!hasPermission) {
			showInfo(
				"Please enable notifications in your device settings to set reminders",
				"Permission Required",
			);
			return;
		}

		const saleDate = new Date(garageSaleDate);
		const oneDayBefore = new Date(saleDate.getTime() - 24 * 60 * 60 * 1000);
		console.log("[ReminderButton] opening date picker, default:", oneDayBefore.toISOString());
		setSelectedDate(oneDayBefore);
		setShowDatePicker(true);
	};

	const handleDateChange = async (event: any, date?: Date) => {
		if (Platform.OS === "android") setShowDatePicker(false);

		if (event.type === "dismissed") {
			setShowDatePicker(false);
			return;
		}

		if (date) {
			setSelectedDate(date);
			if (Platform.OS === "android") {
				await confirmReminder(date);
			}
		}
	};

	const confirmReminder = async (date: Date) => {
		console.log("[ReminderButton] confirmReminder called with:", date.toISOString());
		if (!user) {
			console.log("[ReminderButton] no user in confirmReminder, bailing");
			return;
		}
		setLoading(true);
		setShowDatePicker(false);
		try {
			console.log("[ReminderButton] calling setReminder...");
			const result = await remindersService.setReminder(
				user.id,
				garageSaleId,
				date,
				garageSaleTitle,
			);
			console.log("[ReminderButton] setReminder success:", result);
			setHasReminder(true);
			showSuccess(`Reminder set for ${date.toLocaleString()}`);
		} catch (error: any) {
			console.error("[ReminderButton] Error setting reminder:", error?.message, error);
			showError("Failed to set reminder");
		} finally {
			setLoading(false);
		}
	};

	const iconName = hasReminder ? "notifications-active" : "notifications-none";

	return (
		<>
			<TouchableOpacity
				style={[
					variant === "floating" ? styles.floating : styles.inline,
					showLabel && variant === "inline" && styles.inlineWithLabel,
				]}
				onPress={handlePress}
				disabled={loading}
				activeOpacity={0.8}
			>
				<MaterialIcons name={iconName} size={size} color={TINT} />
				{showLabel && variant === "inline" && (
					<Text style={styles.label}>
						{hasReminder ? "Reminder Set" : "Remind Me"}
					</Text>
				)}
			</TouchableOpacity>

			{showDatePicker && Platform.OS === "ios" && (
				<Modal
					visible={showDatePicker}
					transparent
					animationType="slide"
					onRequestClose={() => setShowDatePicker(false)}
				>
					<View style={styles.modalBackdrop}>
						<View style={styles.modalSheet}>
							<View style={styles.modalHeader}>
								<TouchableOpacity onPress={() => setShowDatePicker(false)}>
									<Text style={styles.modalCancel}>Cancel</Text>
								</TouchableOpacity>
								<Text style={styles.modalTitle}>Set reminder</Text>
								<View style={{ width: 60 }} />
							</View>
							<DateTimePicker
								value={selectedDate}
								mode="datetime"
								display="spinner"
								onChange={handleDateChange}
								minimumDate={new Date()}
								style={styles.iosPicker}
							/>
							<TouchableOpacity
								style={styles.iosConfirmButton}
								onPress={() => confirmReminder(selectedDate)}
							>
								<Text style={styles.iosConfirmText}>Set Reminder</Text>
							</TouchableOpacity>
						</View>
					</View>
				</Modal>
			)}
			{showDatePicker && Platform.OS === "android" && (
				<DateTimePicker
					value={selectedDate}
					mode="datetime"
					display="default"
					onChange={handleDateChange}
					minimumDate={new Date()}
				/>
			)}
		</>
	);
}

const styles = StyleSheet.create({
	floating: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
	},
	inline: {
		alignItems: "center",
		justifyContent: "center",
		padding: 8,
	},
	inlineWithLabel: {
		flexDirection: "row",
		paddingHorizontal: 12,
		paddingVertical: 8,
		backgroundColor: "rgba(223,107,79,0.10)",
		borderRadius: 999,
		borderWidth: 1,
		borderColor: "rgba(223,107,79,0.35)",
	},
	label: {
		marginLeft: 6,
		fontSize: 13,
		fontWeight: "800",
		color: TINT,
	},
	iosConfirmButton: {
		backgroundColor: TINT,
		padding: 16,
		margin: 16,
		borderRadius: 16,
		alignItems: "center",
	},
	iosConfirmText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "800",
	},
	modalBackdrop: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.4)",
		justifyContent: "flex-end",
	},
	modalSheet: {
		backgroundColor: "#fff",
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		paddingBottom: 32,
	},
	modalHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingTop: 14,
		paddingBottom: 8,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: "rgba(0,0,0,0.1)",
	},
	modalTitle: {
		fontSize: 16,
		fontWeight: "800",
		color: "#111",
	},
	modalCancel: {
		fontSize: 15,
		fontWeight: "600",
		color: "#666",
		width: 60,
	},
	iosPicker: {
		alignSelf: "stretch",
	},
});
