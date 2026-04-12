import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import StoryCircle from "./StoryCircle";
import { GarageSale } from "@/types/garageSale";

interface StoriesBarProps {
	sales: GarageSale[];
	onStoryPress: (sale: GarageSale) => void;
}

export default function StoriesBar({ sales, onStoryPress }: StoriesBarProps) {
	if (sales.length === 0) return null;

	return (
		<View style={styles.container}>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.scrollContent}
			>
				{sales.map((sale, index) => (
					<StoryCircle
						key={sale.id}
						imageUrl={sale.images?.[0]}
						title={sale.title}
						hasVideo={!!sale.videoUrl}
						onPress={() => onStoryPress(sale)}
						index={index}
					/>
				))}
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		marginBottom: 16,
		paddingTop: 8,
	},
	scrollContent: {
		paddingHorizontal: 4,
	},
});
