import GradientBackground from "@/components/ui/GradientBackground";
import { garageSaleService } from "@/services/garageSaleService";
import { GarageSale } from "@/types/garageSale";
import { MaterialIcons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    Alert,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function AddVideoScreen() {
  const { id } = useLocalSearchParams();
  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sale, setSale] = useState<GarageSale | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    loadSale();
  }, [id]);

  const loadSale = async () => {
    try {
      const saleData = await garageSaleService.getGarageSaleById(id as string);
      if (saleData) {
        setSale(saleData);
      } else {
        Alert.alert('Error', 'Garage sale not found');
        router.back();
      }
    } catch (error) {
      console.error('Error loading sale:', error);
      Alert.alert('Error', 'Failed to load garage sale');
      router.back();
    }
  };

	const startRecording = async () => {
		if (!cameraRef.current || !isCameraReady) return;

		try {
			setIsRecording(true);
			const video = await cameraRef.current.recordAsync({ maxDuration: 5 });
			if (video) setVideoUri(video.uri);
			setIsRecording(false);
		} catch (error) {
			console.error("Error recording video:", error);
			Alert.alert("Error", "Failed to record video");
			setIsRecording(false);
		}
	};

  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
    }
  };

	const uploadVideo = async () => {
		if (!videoUri) return;

		setUploading(true);
		try {
			await garageSaleService.updateGarageSale(id as string, {
				videoUrl: videoUri,
			});
			Alert.alert("Success", "Video has been added to your garage sale!", [
				{ text: "OK", onPress: () => router.back() },
			]);
		} catch (error) {
			console.error("Error uploading video:", error);
			Alert.alert("Error", "Failed to save video");
		} finally {
			setUploading(false);
		}
	};

	// Permission screen
	if (!permission || !permission.granted) {
		return (
			<SafeAreaView style={styles.safe}>
				<GradientBackground />
				<View style={styles.header}>
					<TouchableOpacity onPress={() => router.back()}>
						<Text style={styles.backChevron}>{"\u2039"}</Text>
					</TouchableOpacity>
					<Text style={styles.headerTitle}>Add Video</Text>
					<View style={{ width: 20 }} />
				</View>
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
					<TouchableOpacity onPress={() => router.back()}>
						<Text style={styles.skipText}>Skip for Now</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		);
	}

	// Preview screen
	if (videoUri) {
		return (
			<View style={styles.container}>
				<Video
					source={{ uri: videoUri }}
					style={StyleSheet.absoluteFill}
					resizeMode={ResizeMode.COVER}
					isLooping
					shouldPlay
				/>

				<SafeAreaView style={styles.previewOverlay}>
					<View style={styles.header}>
						<TouchableOpacity onPress={() => setVideoUri(null)}>
							<Text style={[styles.backChevron, { color: "#fff" }]}>
								{"\u2039"}
							</Text>
						</TouchableOpacity>
						<Text style={[styles.headerTitle, { color: "#fff" }]}>
							Preview
						</Text>
						<View style={{ width: 20 }} />
					</View>
				</SafeAreaView>

				<View style={styles.previewControls}>
					<TouchableOpacity
						style={styles.retakeBtn}
						onPress={() => setVideoUri(null)}
					>
						<Text style={styles.retakeBtnText}>Retake</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={uploadVideo}
						disabled={uploading}
						activeOpacity={0.9}
						style={{ flex: 1 }}
					>
						<LinearGradient
							colors={["#DF6B4F", "#F9AD85"]}
							start={{ x: 0, y: 0.5 }}
							end={{ x: 1, y: 0.5 }}
							style={[styles.uploadBtn, uploading && { opacity: 0.5 }]}
						>
							<Text style={styles.uploadBtnText}>
								{uploading ? "Uploading..." : "Upload Video"}
							</Text>
						</LinearGradient>
					</TouchableOpacity>
				</View>
			</View>
		);
	}

	// Camera screen
	return (
		<SafeAreaView style={styles.safe}>
			<GradientBackground />

			<View style={styles.header}>
				<TouchableOpacity onPress={() => router.back()}>
					<Text style={styles.backChevron}>{"\u2039"}</Text>
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Add Video</Text>
				<View style={{ width: 20 }} />
			</View>

			<View style={styles.cameraWrap}>
				<CameraView
					ref={cameraRef}
					style={StyleSheet.absoluteFill}
					facing="back"
					mode="video"
					onCameraReady={() => setIsCameraReady(true)}
				/>

				{/* Corner brackets */}
				<View style={[styles.corner, styles.cornerTL]} />
				<View style={[styles.corner, styles.cornerTR]} />
				<View style={[styles.corner, styles.cornerBL]} />
				<View style={[styles.corner, styles.cornerBR]} />

				{!isCameraReady && (
					<Text style={styles.cameraHint}>Initializing camera...</Text>
				)}
			</View>

			<View style={styles.controls}>
				<View style={{ width: 44 }} />
				<TouchableOpacity
					style={styles.recordOuter}
					onPress={isRecording ? stopRecording : startRecording}
					disabled={!isCameraReady}
					activeOpacity={0.85}
				>
					<View
						style={[
							styles.recordInner,
							isRecording && styles.recordStop,
							!isCameraReady && { opacity: 0.4 },
						]}
					/>
				</TouchableOpacity>
				<View style={{ width: 44 }} />
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: "#F7F6F4" },
	container: { flex: 1, backgroundColor: "#000" },

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
	},

	corner: {
		position: "absolute",
		width: 32,
		height: 32,
		borderColor: "rgba(255,255,255,0.2)",
	},
	cornerTL: { top: 24, left: 24, borderTopWidth: 2, borderLeftWidth: 2 },
	cornerTR: { top: 24, right: 24, borderTopWidth: 2, borderRightWidth: 2 },
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
	},
	recordStop: {
		borderRadius: 8,
		width: 32,
		height: 32,
		backgroundColor: "#E05244",
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
	skipText: {
		color: "#807A73",
		fontSize: 14,
		marginTop: 12,
	},

	previewOverlay: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
	},
	previewControls: {
		position: "absolute",
		bottom: 40,
		left: 20,
		right: 20,
		flexDirection: "row",
		gap: 12,
	},
	retakeBtn: {
		flex: 1,
		backgroundColor: "rgba(255,255,255,0.2)",
		padding: 16,
		borderRadius: 18,
		alignItems: "center",
	},
	retakeBtnText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "700",
	},
	uploadBtn: {
		padding: 16,
		borderRadius: 18,
		alignItems: "center",
	},
	uploadBtnText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "700",
	},
});
