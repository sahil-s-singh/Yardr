import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

const STEPS = [
	{ label: "Record", activeColor: "#DF6B4F", dotInactive: "#E8E5E1" },
	{ label: "Details", activeColor: "#6366B5", dotInactive: "#E8E5E1" },
	{ label: "Publish", activeColor: "#6BAA8E", dotInactive: "#E8E5E1" },
];

const GRADIENT_ENDS: Record<number, [string, string]> = {
	1: ["#DF6B4F", "#F9AD85"],
	2: ["#DF6B4F", "#6366B5"],
	3: ["#DF6B4F", "#6BAA8E"],
};

export default function ProgressBar({ step }: { step: 1 | 2 | 3 }) {
	const fillPercent = step === 1 ? 33 : step === 2 ? 66 : 100;
	const [from, to] = GRADIENT_ENDS[step];

	return (
		<View style={styles.wrap}>
			{/* Track */}
			<View style={styles.track}>
				<LinearGradient
					colors={[from, to]}
					start={{ x: 0, y: 0.5 }}
					end={{ x: 1, y: 0.5 }}
					style={[styles.fill, { width: `${fillPercent}%` }]}
				/>
			</View>

			{/* Labels */}
			<View style={styles.labels}>
				{STEPS.map((s, i) => {
					const isActive = i + 1 === step;
					const isCompleted = i + 1 < step;
					const dotColor = isActive
						? s.activeColor
						: isCompleted
						? "#23201C"
						: s.dotInactive;
					const textColor = isActive
						? s.activeColor
						: isCompleted
						? "#23201C"
						: "#807A73";
					const fontWeight = isActive ? "700" : "600";

					return (
						<View key={s.label} style={styles.stepItem}>
							<View style={[styles.dot, { backgroundColor: dotColor }]} />
							<Text
								style={[
									styles.stepLabel,
									{ color: textColor, fontWeight: fontWeight as any },
								]}
							>
								{s.label}
							</Text>
						</View>
					);
				})}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {
		paddingHorizontal: 20,
		paddingTop: 4,
		paddingBottom: 8,
		gap: 10,
	},
	track: {
		height: 6,
		borderRadius: 3,
		backgroundColor: "rgba(255,255,255,0.5)",
		overflow: "hidden",
	},
	fill: {
		height: 6,
		borderRadius: 3,
	},
	labels: {
		flexDirection: "row",
	},
	stepItem: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		gap: 5,
	},
	dot: {
		width: 10,
		height: 10,
		borderRadius: 5,
	},
	stepLabel: {
		fontSize: 12,
	},
});
