import React from "react";
import { StyleSheet, View } from "react-native";

import LogoIcon from "@/assets/splash/logo-center.svg";

export default function SaleMapMarker() {
	return (
		<View style={styles.outer}>
			<View style={styles.inner}>
				<LogoIcon width={22} height={22} />
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	outer: {
		width: 46,
		height: 46,
		borderRadius: 23,
		backgroundColor: "#DF6B4F",
		alignItems: "center",
		justifyContent: "center",
		shadowColor: "#000",
		shadowOpacity: 0.25,
		shadowRadius: 6,
		shadowOffset: { width: 0, height: 3 },
		elevation: 5,
	},
	inner: {
		width: 34,
		height: 34,
		borderRadius: 17,
		backgroundColor: "#FFFFFF",
		alignItems: "center",
		justifyContent: "center",
	},
});
