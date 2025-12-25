import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function SellVideo() {
	const colorScheme = useColorScheme();
	const theme = Colors[colorScheme ?? "light"];

	const cameraRef = useRef<CameraView | null>(null);
	const [perm, requestPerm] = useCameraPermissions();

	const [recording, setRecording] = useState(false);

	const onStart = async () => {
		try {
			if (!perm?.granted) {
				const res = await requestPerm();
				if (!res.granted) {
					Alert.alert(
						"Camera Permission",
						"Please allow camera access to record a video."
					);
					return;
				}
			}

			if (!cameraRef.current) return;

			setRecording(true);

			// 5 seconds max
			// @ts-ignore expo-camera types differ by version
			const video = await cameraRef.current.recordAsync({ maxDuration: 5 });

			setRecording(false);

			router.replace({
				pathname: "/(tabs)/sell/publish",
				params: { videoUri: video?.uri ?? "" },
			});
		} catch (e: any) {
			console.error(e);
			setRecording(false);
			Alert.alert("Recording Error", e?.message ?? "Failed to record video.");
		}
	};

	const onSkip = () => {
		router.replace({
			pathname: "/(tabs)/sell/publish",
			params: { mode: "manual" },
		});
	};

	const onClose = () => {
		router.back();
	};

	return (
		<View style={styles.full}>
			<CameraView
				ref={cameraRef as any}
				style={StyleSheet.absoluteFill}
				facing="back"
			/>

			<TouchableOpacity
				style={styles.close}
				onPress={onClose}
				activeOpacity={0.85}
			>
				<IconSymbol size={22} name="xmark" color="#fff" />
			</TouchableOpacity>

			<View style={styles.centerCardWrap} pointerEvents="box-none">
				<View style={[styles.centerCard, { backgroundColor: theme.card }]}>
					<View style={[styles.iconCircle, { backgroundColor: theme.muted }]}>
						<IconSymbol size={26} name="video" color={theme.tint} />
					</View>

					<Text style={[styles.h1, { color: theme.text }]}>
						Record a 5-second video
					</Text>
					<Text style={[styles.p, { color: theme.secondaryText }]}>
						Show your items in a quick video. Our AI will automatically detect
						and tag items for your listing.
					</Text>

					<TouchableOpacity
						style={[styles.primaryBtn, { backgroundColor: theme.tint }]}
						onPress={onStart}
						disabled={recording}
						activeOpacity={0.9}
					>
						<IconSymbol size={18} name="camera" color="#fff" />
						<Text style={styles.primaryText}>
							{recording ? "Recording..." : "Start Recording"}
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						onPress={onSkip}
						activeOpacity={0.8}
						style={styles.skipBtn}
					>
						<Text style={[styles.skipText, { color: theme.secondaryText }]}>
							Skip Video (Fill Manually)
						</Text>
					</TouchableOpacity>
				</View>
			</View>

			<View style={styles.bottomRecordWrap} pointerEvents="none">
				<View style={styles.recordOuter}>
					<View style={styles.recordInner} />
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	full: { flex: 1, backgroundColor: "#000" },

	close: {
		position: "absolute",
		top: 56,
		right: 18,
		width: 44,
		height: 44,
		borderRadius: 999,
		backgroundColor: "rgba(0,0,0,0.35)",
		alignItems: "center",
		justifyContent: "center",
		zIndex: 10,
	},

	centerCardWrap: {
		position: "absolute",
		left: 16,
		right: 16,
		top: 120,
		alignItems: "center",
	},
	centerCard: {
		width: "100%",
		borderRadius: 26,
		paddingHorizontal: 22,
		paddingVertical: 22,
	},
	iconCircle: {
		width: 56,
		height: 56,
		borderRadius: 999,
		alignItems: "center",
		justifyContent: "center",
		alignSelf: "center",
		marginBottom: 14,
	},
	h1: {
		fontSize: 26,
		fontWeight: "900",
		textAlign: "center",
		marginBottom: 10,
	},
	p: {
		fontSize: 16,
		fontWeight: "600",
		textAlign: "center",
		lineHeight: 22,
		marginBottom: 18,
	},

	primaryBtn: {
		height: 58,
		borderRadius: 999,
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "row",
		gap: 12,
	},
	primaryText: { color: "#fff", fontSize: 18, fontWeight: "900" },

	skipBtn: { marginTop: 16, alignItems: "center" },
	skipText: { fontSize: 16, fontWeight: "800" },

	bottomRecordWrap: {
		position: "absolute",
		bottom: 38,
		left: 0,
		right: 0,
		alignItems: "center",
	},
	recordOuter: {
		width: 86,
		height: 86,
		borderRadius: 999,
		borderWidth: 4,
		borderColor: "rgba(255,255,255,0.25)",
		alignItems: "center",
		justifyContent: "center",
	},
	recordInner: {
		width: 54,
		height: 54,
		borderRadius: 999,
		backgroundColor: "#E04B4B",
	},
});
