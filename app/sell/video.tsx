import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function SellVideoScreen() {
	const cameraRef = useRef<CameraView>(null);

	const [permission, requestPermission] = useCameraPermissions();
	const [cameraReady, setCameraReady] = useState(false);
	const [isRecording, setIsRecording] = useState(false);

	useEffect(() => {
		(async () => {
			if (!permission) return;
			if (!permission.granted) {
				const res = await requestPermission();
				if (!res.granted) {
					Alert.alert(
						"Camera Permission",
						"Please allow camera access to record a video."
					);
				}
			}
		})();
	}, [permission, requestPermission]);

	const safeBack = () => {
		// Tabs often have no back stack
		if (router.canGoBack()) router.back();
		else router.replace("/(tabs)");
	};

	const onStartRecording = async () => {
		if (!cameraReady) {
			Alert.alert(
				"Hold on",
				"Camera is still starting up. Try again in a second."
			);
			return;
		}
		if (isRecording) return;

		try {
			setIsRecording(true);

			// recordAsync exists on CameraView via ref in expo-camera
			const video = await cameraRef.current?.recordAsync({
				maxDuration: 5,
				quality: "720p",
			});

			setIsRecording(false);

			if (!video?.uri) {
				Alert.alert("Recording failed", "No video was captured.");
				return;
			}

			// Pass the video uri to publish/review screen
			router.push({
				pathname: "/sell/publish",
				params: { videoUri: video.uri },
			});
		} catch (e: any) {
			setIsRecording(false);
			Alert.alert("Recording error", e?.message ?? "Failed to record video.");
			console.error(e);
		}
	};

	const onStopRecording = async () => {
		try {
			await cameraRef.current?.stopRecording();
		} catch (e) {
			// ignore
		}
	};

	const onSkip = () => {
		router.push("/sell/publish");
	};

	if (!permission?.granted) {
		return (
			<View style={styles.center}>
				<Text style={styles.text}>Requesting camera permission…</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<CameraView
				ref={cameraRef}
				style={StyleSheet.absoluteFill}
				facing="back"
				mode="video"
				onCameraReady={() => setCameraReady(true)}
			/>

			{/* Top right close */}
			<TouchableOpacity onPress={safeBack} style={styles.closeBtn}>
				<Text style={styles.closeText}>✕</Text>
			</TouchableOpacity>

			{/* Center modal UI (matches your screenshot structure) */}
			<View style={styles.modalCard}>
				<View style={styles.iconCircle}>
					<Text style={styles.icon}>📹</Text>
				</View>

				<Text style={styles.title}>Record a 5-second video</Text>
				<Text style={styles.subtitle}>
					Show your items in a quick video. Our AI will automatically detect and
					tag items for your listing.
				</Text>

				<TouchableOpacity
					onPress={onStartRecording}
					disabled={!cameraReady || isRecording}
					style={[
						styles.primaryBtn,
						(!cameraReady || isRecording) && { opacity: 0.6 },
					]}
				>
					<Text style={styles.primaryBtnText}>
						{isRecording ? "Recording…" : "Start Recording"}
					</Text>
				</TouchableOpacity>

				<TouchableOpacity onPress={onSkip} style={styles.skipBtn}>
					<Text style={styles.skipText}>Skip Video (Fill Manually)</Text>
				</TouchableOpacity>
			</View>

			{/* Record button */}
			<View style={styles.recordWrap}>
				<TouchableOpacity
					onPress={isRecording ? onStopRecording : onStartRecording}
					disabled={!cameraReady}
					style={[styles.recordOuter, !cameraReady && { opacity: 0.6 }]}
				>
					<View style={styles.recordInner} />
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#000" },
	center: { flex: 1, alignItems: "center", justifyContent: "center" },
	text: { color: "#111", fontSize: 16 },

	closeBtn: {
		position: "absolute",
		top: 60,
		right: 18,
		width: 44,
		height: 44,
		borderRadius: 22,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(0,0,0,0.35)",
		zIndex: 5,
	},
	closeText: { color: "#fff", fontSize: 18, fontWeight: "700" },

	modalCard: {
		position: "absolute",
		left: 18,
		right: 18,
		top: 120,
		borderRadius: 28,
		paddingVertical: 22,
		paddingHorizontal: 20,
		backgroundColor: "#fff",
		alignItems: "center",
	},
	iconCircle: {
		width: 64,
		height: 64,
		borderRadius: 32,
		backgroundColor: "#F6EEE6",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 10,
	},
	icon: { fontSize: 24 },
	title: { fontSize: 26, fontWeight: "800", color: "#222", marginTop: 6 },
	subtitle: {
		marginTop: 10,
		fontSize: 15,
		lineHeight: 20,
		color: "#6B625A",
		textAlign: "center",
	},

	primaryBtn: {
		marginTop: 18,
		height: 56,
		borderRadius: 28,
		alignSelf: "stretch",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#D88445",
	},
	primaryBtnText: { color: "#fff", fontSize: 18, fontWeight: "800" },

	skipBtn: { marginTop: 14, paddingVertical: 10 },
	skipText: { color: "#8A8077", fontSize: 16, fontWeight: "700" },

	recordWrap: {
		position: "absolute",
		bottom: 70,
		left: 0,
		right: 0,
		alignItems: "center",
	},
	recordOuter: {
		width: 84,
		height: 84,
		borderRadius: 42,
		borderWidth: 4,
		borderColor: "rgba(255,255,255,0.5)",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(0,0,0,0.15)",
	},
	recordInner: {
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: "#E24B43",
	},
});
