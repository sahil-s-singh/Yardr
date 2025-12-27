import DateTimePicker from "@react-native-community/datetimepicker";
import { ResizeMode, Video } from "expo-av";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
	Alert,
	Image,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/contexts/AuthContext";
import {
	clearSellDraft,
	loadSellDraft,
	saveSellDraft,
	SellDraft,
} from "@/lib/draftSale";
import { garageSaleService } from "@/services/garageSaleService";
import { rateLimitService } from "@/services/rateLimitService";

// Step indicator component
function StepHeader({ step }: { step: 1 | 2 | 3 }) {
	return (
		<View style={styles.stepWrap}>
			<Text style={styles.screenTitle}>Add Sale</Text>

			<View style={styles.stepsRow}>
				<View style={styles.stepItem}>
					<View style={[styles.stepCircle, step >= 1 && styles.stepActive]}>
						<IconSymbol
							size={20}
							name="video.fill"
							color={step >= 1 ? "#fff" : "#6F6A64"}
						/>
					</View>
					<Text style={[styles.stepLabel, step >= 1 && styles.stepLabelActive]}>
						Record Video
					</Text>
				</View>

				<View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />

				<View style={styles.stepItem}>
					<View style={[styles.stepCircle, step >= 2 && styles.stepActive]}>
						<IconSymbol
							size={20}
							name="eye.fill"
							color={step >= 2 ? "#fff" : "#6F6A64"}
						/>
					</View>
					<Text style={[styles.stepLabel, step >= 2 && styles.stepLabelActive]}>
						Review
					</Text>
				</View>

				<View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />

				<View style={styles.stepItem}>
					<View style={[styles.stepCircle, step >= 3 && styles.stepActive]}>
						<IconSymbol
							size={20}
							name="checkmark.circle.fill"
							color={step >= 3 ? "#fff" : "#6F6A64"}
						/>
					</View>
					<Text style={[styles.stepLabel, step >= 3 && styles.stepLabelActive]}>
						Publish
					</Text>
				</View>
			</View>
		</View>
	);
}

// Date/time formatting helpers
function yyyyMmDd(d: Date) {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

function hhmm24(d: Date) {
	const h = String(d.getHours()).padStart(2, "0");
	const m = String(d.getMinutes()).padStart(2, "0");
	return `${h}:${m}`;
}

function prettyTime(d: Date) {
	return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function PublishSaleScreen() {
	const { user } = useAuth();

	const [draft, setDraft] = useState<SellDraft | null>(null);
	const [loading, setLoading] = useState(true);
	const [publishing, setPublishing] = useState(false);

	// Contact fields
	const [contactName, setContactName] = useState("");
	const [phone, setPhone] = useState("");
	const [email, setEmail] = useState("");

	// Schedule fields
	const [startDate, setStartDate] = useState<Date>(new Date());
	const [endDate, setEndDate] = useState<Date>(new Date());
	const [startTime, setStartTime] = useState<Date>(new Date());
	const [endTime, setEndTime] = useState<Date>(new Date());

	// Date/time picker visibility
	const [showStartDate, setShowStartDate] = useState(false);
	const [showEndDate, setShowEndDate] = useState(false);
	const [showStartTime, setShowStartTime] = useState(false);
	const [showEndTime, setShowEndTime] = useState(false);

	// Load draft on mount
	useEffect(() => {
		let mounted = true;

		(async () => {
			const d = await loadSellDraft();
			if (!mounted) return;

			setDraft(d);

			// Prefill contact info
			setContactName(d?.contactName || "");
			setPhone(d?.contactPhone || "");
			setEmail(d?.contactEmail || user?.email || "");

			// Setup default dates/times
			const today = new Date();
			const defaultStart = new Date();
			defaultStart.setHours(9, 0, 0, 0);
			const defaultEnd = new Date();
			defaultEnd.setHours(15, 0, 0, 0);

			// Restore from draft if available
			if (d?.startDate) {
				const sd = new Date(d.startDate + "T00:00:00");
				setStartDate(sd);
			} else {
				setStartDate(today);
			}

			if (d?.endDate) {
				const ed = new Date(d.endDate + "T00:00:00");
				setEndDate(ed);
			} else {
				setEndDate(today);
			}

			if (d?.startTime) {
				const t = new Date();
				const [hh, mm] = d.startTime.split(":").map(Number);
				t.setHours(hh, mm, 0, 0);
				setStartTime(t);
			} else {
				setStartTime(defaultStart);
			}

			if (d?.endTime) {
				const t = new Date();
				const [hh, mm] = d.endTime.split(":").map(Number);
				t.setHours(hh, mm, 0, 0);
				setEndTime(t);
			} else {
				setEndTime(defaultEnd);
			}

			setLoading(false);
		})();

		return () => {
			mounted = false;
		};
	}, [user]);

	// Auto-save draft when fields change
	useEffect(() => {
		if (loading || !draft) return;

		saveSellDraft({
			...draft,
			contactName,
			contactPhone: phone,
			contactEmail: email,
			startDate: yyyyMmDd(startDate),
			endDate: yyyyMmDd(endDate),
			startTime: hhmm24(startTime),
			endTime: hhmm24(endTime),
		}).catch(() => {});
	}, [
		loading,
		draft,
		contactName,
		phone,
		email,
		startDate,
		endDate,
		startTime,
		endTime,
	]);

	// Validation
	const canPublish = useMemo(() => {
		return (
			!!draft &&
			!!draft.title &&
			!!draft.description &&
			contactName.trim().length > 0 &&
			!!draft.addressLine
		);
	}, [draft, contactName]);

	// Publish handler
	const handlePublish = async () => {
		if (!draft || !canPublish) {
			Alert.alert(
				"Missing information",
				"Please complete all required fields."
			);
			return;
		}

		// Validate times
		const startDateTime = new Date(startDate);
		startDateTime.setHours(startTime.getHours(), startTime.getMinutes());
		const endDateTime = new Date(endDate);
		endDateTime.setHours(endTime.getHours(), endTime.getMinutes());

		if (endDateTime <= startDateTime) {
			Alert.alert(
				"Invalid time",
				"End date/time must be after start date/time."
			);
			return;
		}

		setPublishing(true);

		try {
			// Check rate limit
			const rateCheck = await rateLimitService.checkRateLimit();
			if (!rateCheck.allowed) {
				Alert.alert(
					"Posting Limit Reached",
					rateCheck.message || "You have reached the posting limit."
				);
				setPublishing(false);
				return;
			}

			// Get device ID
			const deviceId = await rateLimitService.getDeviceId();

			// Create garage sale
			await garageSaleService.addGarageSale(
				{
					title: draft.title!,
					description: draft.description!,
					categories: draft.categories || [],
					location: {
						latitude: draft.coords?.latitude || 52.1332,
						longitude: draft.coords?.longitude || -106.67,
						address: draft.addressLine || "Sale location",
					},
					date: yyyyMmDd(startDate),
					startDate: yyyyMmDd(startDate),
					endDate: yyyyMmDd(endDate),
					startTime: hhmm24(startTime),
					endTime: hhmm24(endTime),
					contactName: contactName.trim(),
					contactPhone: phone.trim() || undefined,
					contactEmail: email.trim() || undefined,
					videoUrl: draft.videoUri || undefined,
					images: draft.photos || undefined,
					isActive: true,
				},
				deviceId,
				user?.id
			);

			// Clear draft and navigate to success
			await clearSellDraft();
			router.replace("/sell/success");
		} catch (e) {
			console.error(e);
			Alert.alert("Error", "Failed to publish sale. Please try again.");
		} finally {
			setPublishing(false);
		}
	};

	const goBack = () => {
		if (router.canGoBack()) router.back();
		else router.replace("/(tabs)");
	};

	if (loading || !draft) {
		return null;
	}

	return (
		<KeyboardAvoidingView
			style={styles.safe}
			behavior={Platform.OS === "ios" ? "padding" : undefined}
		>
			<View style={styles.topBar}>
				<TouchableOpacity onPress={goBack} style={styles.backBtn}>
					<IconSymbol size={24} name="chevron.left" color="#1F1F1F" />
				</TouchableOpacity>
				<View style={{ width: 40 }} />
			</View>

			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<StepHeader step={3} />

				{/* Video Preview */}
				{draft.videoUri && (
					<>
						<Text style={styles.sectionTitle}>Video Preview</Text>
						<View style={styles.videoBox}>
							<Video
								source={{ uri: draft.videoUri }}
								style={styles.video}
								useNativeControls
								resizeMode={ResizeMode.COVER}
								isLooping
							/>
						</View>
					</>
				)}

				{/* AI-Generated Tags */}
				{draft.categories && draft.categories.length > 0 && (
					<View style={styles.card}>
						<View style={styles.rowHeader}>
							<IconSymbol size={18} name="tag.fill" color="#D97B3F" />
							<Text style={styles.cardTitle}>AI-Generated Tags</Text>
						</View>

						<View style={styles.chips}>
							{draft.categories.map((c, idx) => (
								<View key={idx} style={styles.chip}>
									<Text style={styles.chipText}>{c}</Text>
								</View>
							))}
						</View>
					</View>
				)}

				{/* Detected Location */}
				{draft.addressLine && (
					<View style={styles.card}>
						<View style={styles.rowHeader}>
							<IconSymbol size={18} name="location.fill" color="#D97B3F" />
							<Text style={styles.cardTitle}>Detected Location</Text>
						</View>

						<View style={styles.locationBox}>
							<Text style={styles.locationText}>📍 {draft.addressLine}</Text>
						</View>
					</View>
				)}

				{/* Additional Photos */}
				{draft.photos && draft.photos.length > 0 && (
					<>
						<Text style={styles.sectionTitle}>
							Additional Photos ({draft.photos.length})
						</Text>
						<View style={styles.photoGrid}>
							{draft.photos.map((uri, idx) => (
								<Image key={idx} source={{ uri }} style={styles.photo} />
							))}
						</View>
					</>
				)}

				{/* Sale Schedule */}
				<View style={styles.card}>
					<View style={styles.rowHeader}>
						<IconSymbol size={18} name="calendar" color="#D97B3F" />
						<Text style={styles.cardTitle}>Sale Schedule</Text>
					</View>

					<View style={styles.dateRow}>
						<View style={styles.halfField}>
							<Text style={styles.label}>Start Date *</Text>
							<TouchableOpacity
								style={styles.input}
								onPress={() => setShowStartDate(true)}
							>
								<IconSymbol size={16} name="calendar" color="#6F6A64" />
								<Text style={styles.inputText}>{yyyyMmDd(startDate)}</Text>
							</TouchableOpacity>
						</View>

						<View style={styles.halfField}>
							<Text style={styles.label}>Start Time *</Text>
							<TouchableOpacity
								style={styles.input}
								onPress={() => setShowStartTime(true)}
							>
								<IconSymbol size={16} name="clock.fill" color="#6F6A64" />
								<Text style={styles.inputText}>{prettyTime(startTime)}</Text>
							</TouchableOpacity>
						</View>
					</View>

					<View style={styles.dateRow}>
						<View style={styles.halfField}>
							<Text style={styles.label}>End Date *</Text>
							<TouchableOpacity
								style={styles.input}
								onPress={() => setShowEndDate(true)}
							>
								<IconSymbol size={16} name="calendar" color="#6F6A64" />
								<Text style={styles.inputText}>{yyyyMmDd(endDate)}</Text>
							</TouchableOpacity>
						</View>

						<View style={styles.halfField}>
							<Text style={styles.label}>End Time *</Text>
							<TouchableOpacity
								style={styles.input}
								onPress={() => setShowEndTime(true)}
							>
								<IconSymbol size={16} name="clock.fill" color="#6F6A64" />
								<Text style={styles.inputText}>{prettyTime(endTime)}</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>

				{/* Contact Information */}
				<View style={styles.card}>
					<View style={styles.rowHeader}>
						<IconSymbol size={18} name="person.fill" color="#D97B3F" />
						<Text style={styles.cardTitle}>Contact Information</Text>
					</View>

					<Text style={styles.label}>Name *</Text>
					<View style={styles.inputWithIcon}>
						<IconSymbol size={16} name="person.fill" color="#6F6A64" />
						<TextInput
							style={styles.textInput}
							value={contactName}
							onChangeText={setContactName}
							placeholder="Demo User"
							placeholderTextColor="#999"
						/>
					</View>

					<Text style={styles.label}>Phone Number *</Text>
					<View style={styles.inputWithIcon}>
						<IconSymbol size={16} name="phone.fill" color="#6F6A64" />
						<TextInput
							style={styles.textInput}
							value={phone}
							onChangeText={setPhone}
							placeholder="(555) 123-4567"
							placeholderTextColor="#999"
							keyboardType="phone-pad"
						/>
					</View>

					<Text style={styles.label}>Email *</Text>
					<View style={styles.inputWithIcon}>
						<IconSymbol size={16} name="envelope.fill" color="#6F6A64" />
						<TextInput
							style={styles.textInput}
							value={email}
							onChangeText={setEmail}
							placeholder="mail.example@gmail.com"
							placeholderTextColor="#999"
							keyboardType="email-address"
							autoCapitalize="none"
						/>
					</View>
				</View>

				<View style={{ height: 110 }} />
			</ScrollView>

			{/* Publish Button */}
			<View style={styles.bottomBar}>
				<TouchableOpacity
					style={[
						styles.publishBtn,
						(!canPublish || publishing) && { opacity: 0.5 },
					]}
					onPress={handlePublish}
					disabled={!canPublish || publishing}
					activeOpacity={0.92}
				>
					<IconSymbol size={20} name="checkmark.circle.fill" color="#fff" />
					<Text style={styles.publishText}>
						{publishing ? "Publishing..." : "Publish Sale"}
					</Text>
				</TouchableOpacity>
			</View>

			{/* Date/Time Pickers */}
			{showStartDate && (
				<DateTimePicker
					value={startDate}
					mode="date"
					minimumDate={new Date()}
					onChange={(_, d) => {
						setShowStartDate(false);
						if (d) setStartDate(d);
					}}
				/>
			)}

			{showEndDate && (
				<DateTimePicker
					value={endDate}
					mode="date"
					minimumDate={startDate}
					onChange={(_, d) => {
						setShowEndDate(false);
						if (d) setEndDate(d);
					}}
				/>
			)}

			{showStartTime && (
				<DateTimePicker
					value={startTime}
					mode="time"
					onChange={(_, d) => {
						setShowStartTime(false);
						if (d) setStartTime(d);
					}}
				/>
			)}

			{showEndTime && (
				<DateTimePicker
					value={endTime}
					mode="time"
					onChange={(_, d) => {
						setShowEndTime(false);
						if (d) setEndTime(d);
					}}
				/>
			)}
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: "#FAF7F2" },

	topBar: {
		paddingTop: 56,
		paddingHorizontal: 18,
		paddingBottom: 8,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	backBtn: {
		width: 40,
		height: 40,
		alignItems: "center",
		justifyContent: "center",
	},

	content: { paddingHorizontal: 18, paddingTop: 6 },

	screenTitle: {
		textAlign: "center",
		fontSize: 22,
		fontWeight: "800",
		color: "#1F1F1F",
	},

	// Step indicator
	stepWrap: { marginBottom: 10 },
	stepsRow: {
		marginTop: 14,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
	},
	stepItem: { alignItems: "center", width: 110 },
	stepCircle: {
		width: 52,
		height: 52,
		borderRadius: 26,
		backgroundColor: "#F1EDE6",
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: "#E6E1DA",
	},
	stepActive: { backgroundColor: "#D97B3F", borderColor: "#D97B3F" },
	stepLabel: {
		marginTop: 8,
		fontSize: 13,
		color: "#6F6A64",
		fontWeight: "700",
	},
	stepLabelActive: { color: "#D97B3F" },
	stepLine: {
		height: 4,
		width: 44,
		borderRadius: 2,
		backgroundColor: "#E6E1DA",
	},
	stepLineActive: { backgroundColor: "#D97B3F" },

	sectionTitle: {
		marginTop: 14,
		marginBottom: 10,
		fontSize: 16,
		fontWeight: "800",
		color: "#1F1F1F",
	},

	// Video
	videoBox: {
		height: 210,
		borderRadius: 18,
		overflow: "hidden",
		backgroundColor: "#000",
		marginBottom: 14,
	},
	video: { width: "100%", height: "100%" },

	// Cards
	card: {
		marginTop: 14,
		backgroundColor: "#FFF",
		borderWidth: 1,
		borderColor: "#E6E1DA",
		borderRadius: 18,
		padding: 16,
	},
	rowHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		marginBottom: 12,
	},
	cardTitle: { fontSize: 16, fontWeight: "800", color: "#1F1F1F" },

	// Tags
	chips: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
	chip: {
		backgroundColor: "#F7E6D9",
		paddingVertical: 8,
		paddingHorizontal: 14,
		borderRadius: 999,
	},
	chipText: { color: "#D97B3F", fontWeight: "800", fontSize: 14 },

	// Location
	locationBox: {
		borderWidth: 1,
		borderColor: "#E6E1DA",
		borderRadius: 14,
		backgroundColor: "#FAF7F2",
		paddingHorizontal: 14,
		paddingVertical: 14,
	},
	locationText: { fontSize: 15, fontWeight: "700", color: "#1F1F1F" },

	// Photos
	photoGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 12,
		marginBottom: 14,
	},
	photo: {
		width: 108,
		height: 108,
		borderRadius: 14,
		backgroundColor: "#E6E1DA",
	},

	// Form fields
	label: {
		marginTop: 12,
		marginBottom: 8,
		fontSize: 13,
		color: "#6F6A64",
		fontWeight: "800",
	},
	input: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		borderWidth: 1,
		borderColor: "#E6E1DA",
		borderRadius: 14,
		paddingHorizontal: 14,
		paddingVertical: 14,
		backgroundColor: "#FAF7F2",
	},
	inputText: { fontSize: 15, color: "#1F1F1F", fontWeight: "600" },

	inputWithIcon: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		borderWidth: 1,
		borderColor: "#E6E1DA",
		borderRadius: 14,
		paddingHorizontal: 14,
		paddingVertical: 14,
		backgroundColor: "#FAF7F2",
	},
	textInput: {
		flex: 1,
		fontSize: 15,
		color: "#1F1F1F",
		fontWeight: "600",
	},

	dateRow: {
		flexDirection: "row",
		gap: 12,
	},
	halfField: { flex: 1 },

	// Bottom bar
	bottomBar: {
		position: "absolute",
		left: 0,
		right: 0,
		bottom: 0,
		padding: 16,
		backgroundColor: "rgba(250,247,242,0.92)",
		borderTopWidth: 1,
		borderTopColor: "#E6E1DA",
	},
	publishBtn: {
		backgroundColor: "#D97B3F",
		borderRadius: 24,
		paddingVertical: 18,
		paddingHorizontal: 22,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 10,
	},
	publishText: { color: "#fff", fontWeight: "900", fontSize: 18 },
});
