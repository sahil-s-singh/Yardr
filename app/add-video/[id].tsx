import { garageSaleService } from "@/services/garageSaleService";
import { GarageSale } from "@/types/garageSale";
import { ResizeMode, Video } from "expo-av";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
				Alert.alert("Error", "Garage sale not found");
				router.back();
			}
		} catch (error) {
			console.error("Error loading sale:", error);
			Alert.alert("Error", "Failed to load garage sale");
			router.back();
		}
	};

	const startRecording = async () => {
		if (!cameraRef.current || !isCameraReady) {
			Alert.alert(
				"Camera Not Ready",
				"Please wait for the camera to initialize"
			);
			return;
		}

		try {
			setIsRecording(true);

			const video = await cameraRef.current.recordAsync({
				maxDuration: 5,
			});

			if (video) {
				setVideoUri(video.uri);
			}
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

	const retakeVideo = () => {
		setVideoUri(null);
	};

	const uploadVideo = async () => {
		if (!videoUri) return;

		setUploading(true);
		try {
			// For now, save the local video URI to the database
			// In production, you'd upload to cloud storage (Supabase Storage) first
			// and save the cloud URL instead
			await garageSaleService.updateGarageSale(id as string, {
				videoUrl: videoUri,
			});

			Alert.alert("Success", "Video has been added to your garage sale!", [
				{
					text: "OK",
					onPress: () => router.back(),
				},
			]);
		} catch (error) {
			console.error("Error uploading video:", error);
			Alert.alert("Error", "Failed to save video");
		} finally {
			setUploading(false);
		}
	};

	if (!permission) {
		return (
			<View style={styles.container}>
				<Text style={styles.text}>Requesting camera permission...</Text>
			</View>
		);
	}

	if (!permission.granted) {
		return (
			<View style={styles.container}>
				<View style={styles.permissionContainer}>
					<Text style={styles.permissionText}>
						Camera access is required to record a video of your garage sale
					</Text>
					<TouchableOpacity
						style={styles.permissionButton}
						onPress={requestPermission}
					>
						<Text style={styles.permissionButtonText}>Grant Permission</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.skipButton}
						onPress={() => router.back()}
					>
						<Text style={styles.skipButtonText}>Skip for Now</Text>
					</TouchableOpacity>
				</View>
			</View>
		);
	}

	if (videoUri) {
		return (
			<View style={styles.container}>
				<Video
					source={{ uri: videoUri }}
					style={styles.video}
					resizeMode={ResizeMode.COVER}
					isLooping
					shouldPlay
				/>

				<View style={styles.previewControls}>
					<TouchableOpacity style={styles.retakeButton} onPress={retakeVideo}>
						<Text style={styles.retakeButtonText}>Retake</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[styles.uploadButton, uploading && styles.buttonDisabled]}
						onPress={uploadVideo}
						disabled={uploading}
					>
						<Text style={styles.uploadButtonText}>
							{uploading ? "Uploading..." : "Upload Video"}
						</Text>
					</TouchableOpacity>
				</View>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<CameraView
				ref={cameraRef}
				style={styles.camera}
				facing="back"
				mode="video"
				onCameraReady={() => setIsCameraReady(true)}
			>
				<View style={styles.overlay}>
					<Text style={styles.instructions}>
						{!isCameraReady
							? "Camera initializing..."
							: isRecording
							? "Recording... (5 seconds max)"
							: "📹 Record a 5-second video of your garage sale"}
					</Text>

					{!isRecording && isCameraReady && (
						<Text style={styles.subInstructions}>
							Show items, setup, or anything that helps buyers see what you&apos;re
							selling!
						</Text>
					)}

					<View style={styles.controls}>
						{!isRecording ? (
							<>
								<TouchableOpacity
									style={styles.cancelButton}
									onPress={() => router.back()}
								>
									<Text style={styles.cancelButtonText}>Cancel</Text>
								</TouchableOpacity>

								<TouchableOpacity
									style={[
										styles.recordButton,
										!isCameraReady && styles.buttonDisabled,
									]}
									onPress={startRecording}
									disabled={!isCameraReady}
								>
									<View style={styles.recordButtonInner} />
								</TouchableOpacity>

								<View style={styles.placeholder} />
							</>
						) : (
							<>
								<View style={styles.placeholder} />
								<TouchableOpacity
									style={styles.stopButton}
									onPress={stopRecording}
								>
									<View style={styles.stopButtonInner} />
								</TouchableOpacity>
								<View style={styles.placeholder} />
							</>
						)}
					</View>
				</View>
			</CameraView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#000",
	},
	text: {
		color: "#fff",
		fontSize: 16,
		textAlign: "center",
		marginTop: 50,
	},
	permissionContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	permissionText: {
		color: "#fff",
		fontSize: 18,
		textAlign: "center",
		marginBottom: 30,
	},
	permissionButton: {
		backgroundColor: "#0066FF",
		paddingHorizontal: 32,
		paddingVertical: 16,
		borderRadius: 12,
		marginBottom: 16,
	},
	permissionButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "bold",
	},
	skipButton: {
		padding: 12,
	},
	skipButtonText: {
		color: "#999",
		fontSize: 14,
	},
	camera: {
		flex: 1,
	},
	video: {
		flex: 1,
	},
	overlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.3)",
		justifyContent: "space-between",
		paddingTop: 60,
		paddingBottom: 40,
	},
	instructions: {
		color: "#fff",
		fontSize: 20,
		fontWeight: "bold",
		textAlign: "center",
		paddingHorizontal: 20,
	},
	subInstructions: {
		color: "#fff",
		fontSize: 14,
		textAlign: "center",
		paddingHorizontal: 30,
		marginTop: 10,
	},
	controls: {
		flexDirection: "row",
		justifyContent: "space-around",
		alignItems: "center",
		paddingHorizontal: 20,
	},
	recordButton: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: "rgba(255, 255, 255, 0.3)",
		justifyContent: "center",
		alignItems: "center",
	},
	recordButtonInner: {
		width: 60,
		height: 60,
		borderRadius: 30,
		backgroundColor: "#FF3B30",
	},
	stopButton: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: "rgba(255, 255, 255, 0.3)",
		justifyContent: "center",
		alignItems: "center",
	},
	stopButtonInner: {
		width: 40,
		height: 40,
		backgroundColor: "#FF3B30",
	},
	cancelButton: {
		padding: 12,
	},
	cancelButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "600",
	},
	placeholder: {
		width: 60,
	},
	previewControls: {
		position: "absolute",
		bottom: 40,
		left: 20,
		right: 20,
		flexDirection: "row",
		gap: 12,
	},
	retakeButton: {
		flex: 1,
		backgroundColor: "rgba(255, 255, 255, 0.2)",
		padding: 16,
		borderRadius: 12,
		alignItems: "center",
	},
	retakeButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "bold",
	},
	uploadButton: {
		flex: 1,
		backgroundColor: "#0066FF",
		padding: 16,
		borderRadius: 12,
		alignItems: "center",
	},
	uploadButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "bold",
	},
	buttonDisabled: {
		opacity: 0.6,
	},
});
