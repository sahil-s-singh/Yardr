import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/contexts/AuthContext";
import { garageSaleService } from "@/services/garageSaleService";
import { rateLimitService } from "@/services/rateLimitService";
import { GarageSale } from "@/types/garageSale";
import { ResizeMode, Video } from "expo-av";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
	Alert,
	RefreshControl,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
	View,
} from "react-native";

export default function MySalesScreen() {
	const { user, isAuthenticated } = useAuth();
	const [mySales, setMySales] = useState<GarageSale[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	useEffect(() => {
		loadMySales();
	}, [isAuthenticated, user]);

	const loadMySales = async () => {
		try {
			const deviceId = await rateLimitService.getDeviceId();

			// Get sales by user_id (if logged in) OR device_id
			const sales = await garageSaleService.getGarageSalesByUserOrDevice(
				user?.id || null,
				deviceId
			);
			setMySales(sales);
		} catch (error) {
			console.error("Error loading my sales:", error);
			Alert.alert("Error", "Failed to load your garage sales");
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	const handleRefresh = () => {
		setRefreshing(true);
		loadMySales();
	};

	const handleEdit = (sale: GarageSale) => {
		router.push(`/edit-sale/${sale.id}`);
	};

	const handleAddVideo = (sale: GarageSale) => {
		router.push(`/add-video/${sale.id}`);
	};

	const handleToggleActive = async (sale: GarageSale) => {
		const action = sale.isActive ? "deactivate" : "activate";
		Alert.alert(
			`${action === "deactivate" ? "Deactivate" : "Activate"} Sale`,
			`Are you sure you want to ${action} this garage sale?`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: action === "deactivate" ? "Deactivate" : "Activate",
					style: action === "deactivate" ? "destructive" : "default",
					onPress: async () => {
						try {
							await garageSaleService.updateGarageSale(sale.id, {
								isActive: !sale.isActive,
							});
							Alert.alert("Success", `Garage sale ${action}d`);
							loadMySales();
						} catch (error) {
							console.error("Error toggling active status:", error);
							Alert.alert("Error", `Failed to ${action} garage sale`);
						}
					},
				},
			]
		);
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			weekday: "short",
			month: "short",
			day: "numeric",
		});
	};

	const formatTime = (time: string) => {
		const [hours, minutes] = time.split(":");
		const hour = parseInt(hours);
		const ampm = hour >= 12 ? "PM" : "AM";
		const displayHour = hour % 12 || 12;
		return `${displayHour}:${minutes} ${ampm}`;
	};

	if (loading) {
		return (
			<View style={styles.container}>
				<ThemedView style={styles.content}>
					<ThemedText>Loading your garage sales...</ThemedText>
				</ThemedView>
			</View>
		);
	}

	if (mySales.length === 0) {
		return (
			<ScrollView
				style={styles.container}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
				}
			>
				<ThemedView style={styles.content}>
					<View style={styles.emptyState}>
						<ThemedText style={styles.emptyIcon}>📦</ThemedText>
						<ThemedText type="subtitle" style={styles.emptyTitle}>
							No Garage Sales Yet
						</ThemedText>
						<ThemedText style={styles.emptyText}>
							{isAuthenticated
								? "You haven't created any garage sales. Tap the + button on the home screen to create your first one!"
								: "You haven't created any garage sales from this device. Tap the + button on the home screen to create your first one! (Sign in to sync across devices)"}
						</ThemedText>
						<TouchableOpacity
							style={styles.createButton}
							onPress={() => router.back()}
						>
							<ThemedText style={styles.createButtonText}>
								Go to Home
							</ThemedText>
						</TouchableOpacity>
						{!isAuthenticated && (
							<TouchableOpacity
								style={[styles.createButton, styles.signInButtonAlt]}
								onPress={() => router.push("/auth/sign-in")}
							>
								<ThemedText style={styles.createButtonText}>Sign In</ThemedText>
							</TouchableOpacity>
						)}
					</View>
				</ThemedView>
			</ScrollView>
		);
	}

	return (
		<ScrollView
			style={styles.container}
			refreshControl={
				<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
			}
		>
			<ThemedView style={styles.content}>
				<ThemedText type="subtitle" style={styles.header}>
					My Garage Sales ({mySales.length})
				</ThemedText>

				{mySales.map((sale) => (
					<View
						key={sale.id}
						style={[styles.saleCard, !sale.isActive && styles.saleCardInactive]}
					>
						{/* Video Preview */}
						{sale.videoUrl && (
							<Video
								source={{ uri: sale.videoUrl }}
								style={styles.video}
								resizeMode={ResizeMode.COVER}
								isLooping
								isMuted
							/>
						)}

						{/* Status Badge */}
						<View style={styles.statusBadge}>
							<ThemedText style={styles.statusText}>
								{sale.isActive ? "✓ Active" : "✕ Inactive"}
							</ThemedText>
						</View>

						{/* Sale Details */}
						<View style={styles.saleDetails}>
							<ThemedText style={styles.saleTitle}>{sale.title}</ThemedText>

							<View style={styles.detailRow}>
								<ThemedText style={styles.detailIcon}>📅</ThemedText>
								<ThemedText style={styles.detailText}>
									{formatDate(sale.date)}
								</ThemedText>
							</View>

							<View style={styles.detailRow}>
								<ThemedText style={styles.detailIcon}>🕐</ThemedText>
								<ThemedText style={styles.detailText}>
									{formatTime(sale.startTime)} - {formatTime(sale.endTime)}
								</ThemedText>
							</View>

							<View style={styles.detailRow}>
								<ThemedText style={styles.detailIcon}>📍</ThemedText>
								<ThemedText style={styles.detailText} numberOfLines={1}>
									{sale.location.address}
								</ThemedText>
							</View>

							<View style={styles.detailRow}>
								<ThemedText style={styles.detailIcon}>📝</ThemedText>
								<ThemedText style={styles.detailText} numberOfLines={2}>
									{sale.description}
								</ThemedText>
							</View>
						</View>

						{/* Action Buttons */}
						<View style={styles.actions}>
							<TouchableOpacity
								style={[styles.actionButton, styles.editButton]}
								onPress={() => handleEdit(sale)}
							>
								<ThemedText style={styles.actionButtonText}>✏️ Edit</ThemedText>
							</TouchableOpacity>

							{!sale.videoUrl && (
								<TouchableOpacity
									style={[styles.actionButton, styles.videoButton]}
									onPress={() => handleAddVideo(sale)}
								>
									<ThemedText style={styles.actionButtonText}>
										📹 Add Video
									</ThemedText>
								</TouchableOpacity>
							)}

							<TouchableOpacity
								style={[
									styles.actionButton,
									sale.isActive
										? styles.deactivateButton
										: styles.activateButton,
								]}
								onPress={() => handleToggleActive(sale)}
							>
								<ThemedText style={styles.actionButtonText}>
									{sale.isActive ? "✕ Deactivate" : "✓ Activate"}
								</ThemedText>
							</TouchableOpacity>
						</View>
					</View>
				))}
			</ThemedView>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		padding: 20,
	},
	header: {
		marginBottom: 20,
	},
	emptyState: {
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 60,
	},
	emptyIcon: {
		fontSize: 64,
		marginBottom: 16,
	},
	emptyTitle: {
		marginBottom: 12,
		textAlign: "center",
	},
	emptyText: {
		textAlign: "center",
		opacity: 0.7,
		marginBottom: 24,
		paddingHorizontal: 20,
	},
	signInButton: {
		backgroundColor: "#0066FF",
		paddingHorizontal: 32,
		paddingVertical: 16,
		borderRadius: 12,
	},
	signInButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "bold",
	},
	createButton: {
		backgroundColor: "#0066FF",
		paddingHorizontal: 32,
		paddingVertical: 16,
		borderRadius: 12,
		marginTop: 8,
	},
	createButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "bold",
	},
	signInButtonAlt: {
		backgroundColor: "#34C759",
	},
	saleCard: {
		backgroundColor: "#f8f8f8",
		borderRadius: 16,
		marginBottom: 16,
		overflow: "hidden",
		borderWidth: 2,
		borderColor: "#0066FF",
	},
	saleCardInactive: {
		borderColor: "#ccc",
		opacity: 0.7,
	},
	video: {
		width: "100%",
		height: 180,
		backgroundColor: "#000",
	},
	statusBadge: {
		position: "absolute",
		top: 12,
		right: 12,
		backgroundColor: "rgba(0, 0, 0, 0.7)",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 12,
	},
	statusText: {
		color: "#fff",
		fontSize: 12,
		fontWeight: "bold",
	},
	saleDetails: {
		padding: 16,
	},
	saleTitle: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 12,
	},
	detailRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		marginBottom: 8,
	},
	detailIcon: {
		fontSize: 14,
		marginRight: 8,
		width: 20,
	},
	detailText: {
		fontSize: 14,
		flex: 1,
	},
	actions: {
		flexDirection: "row",
		flexWrap: "wrap",
		padding: 12,
		paddingTop: 0,
		gap: 8,
	},
	actionButton: {
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderRadius: 8,
		flex: 1,
		minWidth: 100,
		alignItems: "center",
	},
	editButton: {
		backgroundColor: "#0066FF",
	},
	videoButton: {
		backgroundColor: "#FF9500",
	},
	activateButton: {
		backgroundColor: "#34C759",
	},
	deactivateButton: {
		backgroundColor: "#FF3B30",
	},
	actionButtonText: {
		color: "#fff",
		fontSize: 13,
		fontWeight: "600",
	},
});
