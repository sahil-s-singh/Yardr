import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Accent, Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

const RING_COLORS = [
	"#DF6B4F", // primary
	Accent.sage,
	Accent.indigo,
	Accent.gold,
	Accent.peach,
];

interface StoryCircleProps {
	imageUrl?: string;
	title: string;
	hasVideo: boolean;
	onPress: () => void;
	index?: number;
}

export default function StoryCircle({
	imageUrl,
	title,
	hasVideo,
	onPress,
	index = 0,
}: StoryCircleProps) {
	const colorScheme = useColorScheme();
	const theme = Colors[colorScheme ?? "light"];
	const ringColor = RING_COLORS[index % RING_COLORS.length];

	return (
		<TouchableOpacity
			style={styles.container}
			onPress={onPress}
			activeOpacity={0.7}
			disabled={!hasVideo}
		>
			<View
				style={[
					styles.circleOuter,
					{
						borderColor: hasVideo ? ringColor : theme.border,
						borderWidth: hasVideo ? 2.5 : 1.5,
					},
				]}
			>
				<View style={[styles.circleInner, { backgroundColor: theme.card }]}>
					{imageUrl ? (
						<Image source={{ uri: imageUrl }} style={styles.image} />
					) : (
						<View
							style={[styles.placeholder, { backgroundColor: theme.muted }]}
						>
							<Text style={[styles.placeholderText, { color: theme.text }]}>
								{title.charAt(0).toUpperCase()}
							</Text>
						</View>
					)}
				</View>
			</View>
			<Text
				style={[styles.title, { color: theme.secondaryText }]}
				numberOfLines={1}
			>
				{title}
			</Text>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	container: {
		alignItems: "center",
		width: 76,
		marginRight: 10,
	},
	circleOuter: {
		width: 62,
		height: 62,
		borderRadius: 31,
		padding: 2,
		marginBottom: 6,
	},
	circleInner: {
		width: "100%",
		height: "100%",
		borderRadius: 28,
		overflow: "hidden",
	},
	image: {
		width: "100%",
		height: "100%",
		resizeMode: "cover",
	},
	placeholder: {
		width: "100%",
		height: "100%",
		justifyContent: "center",
		alignItems: "center",
	},
	placeholderText: {
		fontSize: 22,
		fontWeight: "700",
	},
	title: {
		fontSize: 11,
		fontWeight: "600",
		textAlign: "center",
	},
});
