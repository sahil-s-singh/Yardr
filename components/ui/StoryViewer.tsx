import { useVideoPlayer, VideoView } from "expo-video";
import { router } from "expo-router";
import React, { useEffect } from "react";
import {
	Dimensions,
	Modal,
	StatusBar,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import { GarageSale } from "@/types/garageSale";

interface StoryViewerProps {
	visible: boolean;
	sale: GarageSale | null;
	onClose: () => void;
}

const { width, height } = Dimensions.get("window");

export default function StoryViewer({
	visible,
	sale,
	onClose,
}: StoryViewerProps) {
	const player = useVideoPlayer(sale?.videoUrl ?? null, (p) => {
		p.loop = true;
	});

	useEffect(() => {
		if (visible && sale?.videoUrl) {
			player.play();
		}
	}, [visible, sale?.videoUrl]);

	if (!sale || !sale.videoUrl) {
		return null;
	}

	const handleViewDetails = () => {
		onClose();
		router.push(`/sale-detail/${sale.id}`);
	};

	return (
		<Modal
			visible={visible}
			animationType="fade"
			onRequestClose={onClose}
			statusBarTranslucent
		>
			<StatusBar hidden />
			<View style={styles.container}>
				{/* Close Button */}
				<TouchableOpacity style={styles.closeButton} onPress={onClose}>
					<MaterialIcons name="close" size={28} color="#fff" />
				</TouchableOpacity>

				{/* Video */}
				<VideoView
					player={player}
					style={styles.video}
					contentFit="contain"
					nativeControls={false}
				/>

				{/* Sale Info Overlay — tap to view details */}
				<TouchableOpacity
					style={styles.infoContainer}
					onPress={handleViewDetails}
					activeOpacity={0.85}
				>
					<View style={styles.infoText}>
						<Text style={styles.title} numberOfLines={1}>
							{sale.title}
						</Text>
						<Text style={styles.address} numberOfLines={1}>
							{sale.location.address}
						</Text>
					</View>
					<View style={styles.detailsCta}>
						<Text style={styles.detailsCtaText}>View Details</Text>
						<MaterialIcons name="chevron-right" size={18} color="#fff" />
					</View>
				</TouchableOpacity>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#000",
		justifyContent: "center",
		alignItems: "center",
	},
	closeButton: {
		position: "absolute",
		top: 50,
		right: 20,
		zIndex: 10,
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: "rgba(0, 0, 0, 0.5)",
		justifyContent: "center",
		alignItems: "center",
	},
	video: {
		width,
		height,
	},
	infoContainer: {
		position: "absolute",
		bottom: 60,
		left: 20,
		right: 20,
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		backgroundColor: "rgba(0,0,0,0.35)",
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 18,
	},
	infoText: {
		flex: 1,
	},
	detailsCta: {
		flexDirection: "row",
		alignItems: "center",
		gap: 2,
		backgroundColor: "rgba(223,107,79,0.9)",
		paddingVertical: 8,
		paddingLeft: 14,
		paddingRight: 10,
		borderRadius: 999,
	},
	detailsCtaText: {
		color: "#fff",
		fontSize: 13,
		fontWeight: "800",
	},
	title: {
		fontSize: 20,
		fontWeight: "800",
		color: "#fff",
		marginBottom: 4,
		textShadowColor: "rgba(0, 0, 0, 0.75)",
		textShadowOffset: { width: 0, height: 1 },
		textShadowRadius: 3,
	},
	address: {
		fontSize: 14,
		fontWeight: "600",
		color: "#fff",
		opacity: 0.9,
		textShadowColor: "rgba(0, 0, 0, 0.75)",
		textShadowOffset: { width: 0, height: 1 },
		textShadowRadius: 3,
	},
});
