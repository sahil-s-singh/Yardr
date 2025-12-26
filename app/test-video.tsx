import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import VideoRecorder from "@/components/VideoRecorder";
import { analyzeGarageSaleVideo } from "@/lib/claude";
import { videoService } from "@/services/videoService";
import { EncodingType, readAsStringAsync } from "expo-file-system/legacy";
import { router } from "expo-router";
import * as VideoThumbnails from "expo-video-thumbnails";
import { useState } from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";

export default function TestVideoScreen() {
	const [showCamera, setShowCamera] = useState(false);
	const [analyzing, setAnalyzing] = useState(false);
	const [result, setResult] = useState<any>(null);

	const handleVideoRecorded = async (videoUri: string, frames: string[]) => {
		setShowCamera(false);
		setAnalyzing(true);

		try {
			console.log("Video recorded:", videoUri);

			// Step 1: Generate thumbnails from video at different timestamps
			const thumbnailPromises = [0, 2500, 4500].map((time) =>
				VideoThumbnails.getThumbnailAsync(videoUri, { time })
			);

			const thumbnails = await Promise.all(thumbnailPromises);
			console.log("Generated thumbnails");

			// Step 2: Convert thumbnails to base64
			const base64Frames = await Promise.all(
				thumbnails.map(async (thumbnail) => {
					const base64 = await readAsStringAsync(thumbnail.uri, {
						encoding: EncodingType.Base64,
					});
					return base64;
				})
			);

			console.log("Converted thumbnails to base64");

			// Step 3: Call Claude API with the frames
			console.log("Analyzing with Claude...");
			const analysis = await analyzeGarageSaleVideo(base64Frames);
			console.log("Analysis result:", analysis);

			// Step 4: Upload video to Supabase
			console.log("Uploading video to Supabase...");
			const videoUrl = await videoService.uploadVideo(videoUri);
			console.log("Video uploaded:", videoUrl);

			setResult({
				...analysis,
				videoUrl,
			});

			Alert.alert(
				"Success!",
				`AI Analysis:\n\nTitle: ${analysis.title}\n\nDescription: ${
					analysis.description
				}\n\nCategories: ${analysis.categories.join(
					", "
				)}\n\nVideo URL: ${videoUrl}`,
				[{ text: "OK" }]
			);
		} catch (error: any) {
			console.error("Test failed:", error);
			Alert.alert("Error", error.message || "Failed to process video");
		} finally {
			setAnalyzing(false);
		}
	};

	if (analyzing) {
		return (
			<View style={styles.container}>
				<ThemedView style={styles.content}>
					<ThemedText type="title">🤖 Analyzing with AI...</ThemedText>
					<ThemedText style={styles.subtitle}>
						This may take a few seconds
					</ThemedText>

					<View style={styles.stepsContainer}>
						<ThemedText style={styles.step}>✓ Video recorded</ThemedText>
						<ThemedText style={styles.step}>⏳ Extracting frames...</ThemedText>
						<ThemedText style={styles.step}>
							⏳ Calling Claude API...
						</ThemedText>
						<ThemedText style={styles.step}>
							⏳ Uploading to Supabase...
						</ThemedText>
					</View>
				</ThemedView>
			</View>
		);
	}

	if (showCamera) {
		return (
			<VideoRecorder
				onVideoRecorded={handleVideoRecorded}
				onCancel={() => setShowCamera(false)}
			/>
		);
	}

	return (
		<View style={styles.container}>
			<ThemedView style={styles.header}>
				<TouchableOpacity
					onPress={() => router.back()}
					style={styles.backButton}
				>
					<ThemedText style={styles.backButtonText}>← Back</ThemedText>
				</TouchableOpacity>
				<ThemedText type="title">Test Video Feature</ThemedText>
			</ThemedView>

			<ThemedView style={styles.content}>
				<ThemedText style={styles.sectionTitle}>
					📹 Video Feature Test
				</ThemedText>
				<ThemedText style={styles.description}>
					This will test the complete video workflow:
				</ThemedText>

				<View style={styles.stepsContainer}>
					<ThemedText style={styles.step}>
						1️⃣ Record a 5-second video
					</ThemedText>
					<ThemedText style={styles.step}>
						2️⃣ Extract frames from video
					</ThemedText>
					<ThemedText style={styles.step}>3️⃣ Analyze with Claude AI</ThemedText>
					<ThemedText style={styles.step}>
						4️⃣ Upload to Supabase Storage
					</ThemedText>
					<ThemedText style={styles.step}>5️⃣ Show results</ThemedText>
				</View>

				<TouchableOpacity
					style={styles.startButton}
					onPress={() => setShowCamera(true)}
				>
					<ThemedText style={styles.startButtonText}>🎬 Start Test</ThemedText>
				</TouchableOpacity>

				{result && (
					<View style={styles.resultContainer}>
						<ThemedText style={styles.resultTitle}>✅ Test Results:</ThemedText>
						<ThemedText style={styles.resultText}>
							<ThemedText style={styles.bold}>Title:</ThemedText> {result.title}
						</ThemedText>
						<ThemedText style={styles.resultText}>
							<ThemedText style={styles.bold}>Description:</ThemedText>{" "}
							{result.description}
						</ThemedText>
						<ThemedText style={styles.resultText}>
							<ThemedText style={styles.bold}>Categories:</ThemedText>{" "}
							{result.categories.join(", ")}
						</ThemedText>
						<ThemedText style={styles.resultText}>
							<ThemedText style={styles.bold}>Video URL:</ThemedText>{" "}
							{result.videoUrl}
						</ThemedText>
					</View>
				)}

				<View style={styles.requirementsContainer}>
					<ThemedText style={styles.requirementsTitle}>
						⚠️ Requirements:
					</ThemedText>
					<ThemedText style={styles.requirement}>
						✓ Run SQL migration (add video_url column)
					</ThemedText>
						<ThemedText style={styles.requirement}>
							✓ Create garage-sale-videos storage bucket (public)
						</ThemedText>
					<ThemedText style={styles.requirement}>
						✓ Test on real device (camera required)
					</ThemedText>
					<ThemedText style={styles.requirement}>
						✓ Claude API key configured
					</ThemedText>
				</View>
			</ThemedView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f5f5f5",
	},
	header: {
		padding: 20,
		paddingTop: 60,
		borderBottomWidth: 1,
		borderBottomColor: "#e0e0e0",
	},
	backButton: {
		marginBottom: 10,
	},
	backButtonText: {
		fontSize: 16,
		color: "#0066FF",
	},
	content: {
		flex: 1,
		padding: 20,
	},
	sectionTitle: {
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 10,
	},
	description: {
		fontSize: 16,
		marginBottom: 20,
		opacity: 0.7,
	},
	stepsContainer: {
		backgroundColor: "#fff",
		padding: 20,
		borderRadius: 10,
		marginBottom: 20,
	},
	step: {
		fontSize: 16,
		marginBottom: 10,
	},
	startButton: {
		backgroundColor: "#0066FF",
		padding: 20,
		borderRadius: 10,
		alignItems: "center",
		marginBottom: 20,
	},
	startButtonText: {
		color: "#fff",
		fontSize: 20,
		fontWeight: "bold",
	},
	resultContainer: {
		backgroundColor: "#e8f5e9",
		padding: 20,
		borderRadius: 10,
		marginBottom: 20,
	},
	resultTitle: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 10,
	},
	resultText: {
		fontSize: 14,
		marginBottom: 8,
	},
	bold: {
		fontWeight: "bold",
	},
	requirementsContainer: {
		backgroundColor: "#fff3cd",
		padding: 15,
		borderRadius: 10,
	},
	requirementsTitle: {
		fontSize: 16,
		fontWeight: "bold",
		marginBottom: 10,
	},
	requirement: {
		fontSize: 14,
		marginBottom: 5,
	},
	subtitle: {
		fontSize: 16,
		marginTop: 10,
		opacity: 0.7,
	},
});
