// app/sell/index.tsx — Step 1: Record Video
import GradientBackground from "@/components/ui/GradientBackground";
import ProgressBar from "@/components/ui/ProgressBar";
import { saveSellDraft } from "@/lib/draftSale";
import { MaterialIcons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
	Alert,
	SafeAreaView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

export default function RecordVideoScreen() {
	const cameraRef = useRef<CameraView>(null);
	const [permission, requestPermission] = useCameraPermissions();
	const [isRecording, setIsRecording] = useState(false);
	const [cameraReady, setCameraReady] = useState(false);
	const [facing, setFacing] = useState<"back" | "front">("back");

	useEffect(() => {
		if (permission && !permission.granted) {
			requestPermission();
		}
	}, [permission]);

	const toggleRecording = async () => {
		if (!cameraRef.current || !cameraReady) return;

		if (isRecording) {
			cameraRef.current.stopRecording();
			setIsRecording(false);
		} else {
			setIsRecording(true);

			try {
				const video = await cameraRef.current.recordAsync({
					maxDuration: 5,
				});

				if (!video?.uri) {
					Alert.alert("Recording Failed", "No video was recorded.");
					return;
				}

				await saveSellDraft({ videoUri: video.uri });

				router.replace({
					pathname: "/sell/video",
					params: { videoUri: video.uri },
				});
			} catch (error) {
				console.error("Recording error:", error);
				Alert.alert("Recording Error", "Failed to record video.");
			} finally {
				setIsRecording(false);
			}
		}
	};

	if (!permission?.granted) {
		return (
			<SafeAreaView style={styles.safe}>
				<GradientBackground />
				<View style={styles.permissionWrap}>
					<MaterialIcons name="videocam-off" size={48} color="#807A73" />
					<Text style={styles.permissionTitle}>Camera Access Needed</Text>
					<Text style={styles.permissionSub}>
						We need camera permission to record a video of your sale items.
					</Text>
					<TouchableOpacity
						style={styles.permissionBtn}
						onPress={requestPermission}
					>
						<Text style={styles.permissionBtnText}>Allow Camera</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.safe}>
			<GradientBackground />

			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity onPress={() => router.back()}>
					<Text style={styles.backChevron}>{"\u2039"}</Text>
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Record Video</Text>
				<TouchableOpacity onPress={() => router.replace("/sell/video")}>
					<Text style={styles.skipText}>Skip</Text>
				</TouchableOpacity>
			</View>

			{/* Progress Bar */}
			<ProgressBar step={1} />

			{/* Camera Preview */}
			<View style={styles.cameraWrap}>
				<CameraView
					ref={cameraRef}
					style={StyleSheet.absoluteFill}
					facing={facing}
					mode="video"
					onCameraReady={() => setCameraReady(true)}
				/>

				{/* Corner brackets */}
				<View style={[styles.corner, styles.cornerTL]} />
				<View style={[styles.corner, styles.cornerTR]} />
				<View style={[styles.corner, styles.cornerBL]} />
				<View style={[styles.corner, styles.cornerBR]} />

				{!cameraReady && (
					<Text style={styles.cameraHint}>Point camera at your items</Text>
				)}
			</View>

			{/* Controls */}
			<View style={styles.controls}>
				{/* Gallery */}
				<TouchableOpacity style={styles.sideBtn}>
					<MaterialIcons name="photo-library" size={24} color="#807A73" />
				</TouchableOpacity>

				{/* Record Button */}
				<TouchableOpacity
					style={styles.recordOuter}
					onPress={toggleRecording}
					disabled={!cameraReady}
					activeOpacity={0.85}
				>
					<View
						style={[
							styles.recordInner,
							isRecording && styles.recordInnerActive,
							!cameraReady && { opacity: 0.4 },
						]}
					>
						{isRecording ? (
							<MaterialIcons name="stop" size={28} color="#fff" />
						) : (
							<View style={styles.recordDot} />
						)}
					</View>
				</TouchableOpacity>

				{/* Flip Camera */}
				<TouchableOpacity
					style={styles.sideBtn}
					onPress={() => setFacing(facing === "back" ? "front" : "back")}
				>
					<MaterialIcons name="cameraswitch" size={24} color="#807A73" />
				</TouchableOpacity>
			</View>
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
	skipText: {
		fontSize: 15,
		fontWeight: "600",
		color: "#807A73",
	},

	cameraWrap: {
		flex: 1,
		marginHorizontal: 16,
		borderRadius: 24,
		overflow: "hidden",
		backgroundColor: "#1A1A1C",
		alignItems: "center",
		justifyContent: "center",
	},
	cameraHint: {
		color: "#737373",
		fontSize: 15,
		fontWeight: "500",
	},

	// Corner brackets
	corner: {
		position: "absolute",
		width: 32,
		height: 32,
		borderColor: "rgba(255,255,255,0.2)",
	},
	cornerTL: {
		top: 24,
		left: 24,
		borderTopWidth: 2,
		borderLeftWidth: 2,
	},
	cornerTR: {
		top: 24,
		right: 24,
		borderTopWidth: 2,
		borderRightWidth: 2,
	},
	cornerBL: {
		bottom: 24,
		left: 24,
		borderBottomWidth: 2,
		borderLeftWidth: 2,
	},
	cornerBR: {
		bottom: 24,
		right: 24,
		borderBottomWidth: 2,
		borderRightWidth: 2,
	},

	controls: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 20,
		paddingBottom: 30,
		gap: 50,
	},
	sideBtn: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: "rgba(255,255,255,0.5)",
		borderWidth: 1,
		borderColor: "rgba(232,229,225,0.5)",
		alignItems: "center",
		justifyContent: "center",
	},
	recordOuter: {
		width: 72,
		height: 72,
		borderRadius: 36,
		borderWidth: 3,
		borderColor: "rgba(223,107,79,0.3)",
		alignItems: "center",
		justifyContent: "center",
	},
	recordInner: {
		width: 52,
		height: 52,
		borderRadius: 26,
		backgroundColor: "#DF6B4F",
		alignItems: "center",
		justifyContent: "center",
	},
	recordInnerActive: {
		backgroundColor: "#E05244",
		borderRadius: 12,
		width: 44,
		height: 44,
	},
	recordDot: {
		width: 20,
		height: 20,
		borderRadius: 10,
		backgroundColor: "rgba(255,255,255,0.9)",
	},

	permissionWrap: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 40,
	},
	permissionTitle: {
		fontSize: 20,
		fontWeight: "700",
		color: "#23201C",
		marginTop: 16,
	},
	permissionSub: {
		fontSize: 15,
		color: "#807A73",
		textAlign: "center",
		marginTop: 8,
		lineHeight: 22,
	},
	permissionBtn: {
		marginTop: 24,
		backgroundColor: "#DF6B4F",
		borderRadius: 18,
		paddingVertical: 14,
		paddingHorizontal: 28,
	},
	permissionBtnText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "700",
	},
});
