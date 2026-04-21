import { useVideoPlayer, VideoView } from "expo-video";
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

				{/* Sale Info Overlay */}
				<View style={styles.infoContainer}>
					<Text style={styles.title}>{sale.title}</Text>
					<Text style={styles.address}>{sale.location.address}</Text>
				</View>
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
