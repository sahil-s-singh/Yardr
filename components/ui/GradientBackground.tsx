import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View } from "react-native";

/**
 * Warm peach gradient that sits behind the top portion of screens,
 * matching the Figma design language.
 */
export default function GradientBackground() {
	return (
		<View style={StyleSheet.absoluteFill} pointerEvents="none">
			<LinearGradient
				colors={[
					"rgba(249,173,133,0.25)",
					"rgba(249,173,133,0.10)",
					"rgba(247,246,244,0)",
				]}
				locations={[0, 0.35, 0.7]}
				style={styles.gradient}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	gradient: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		height: 350,
	},
});
