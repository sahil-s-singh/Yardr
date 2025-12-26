import { router } from "expo-router";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ProfileMenuSheet({ visible, onClose }: any) {
	return (
		<Modal visible={visible} animationType="slide" transparent>
			<View style={styles.overlay}>
				<View style={styles.sheet}>
					<Menu label="My Sales" onPress={() => router.push("/my-sales")} />
					<Menu label="Saved Sales" />
					<Menu label="Notifications" />
					<Menu label="Settings" />
					<Menu label="Help & Support" />
					<Menu label="Close" onPress={onClose} />
				</View>
			</View>
		</Modal>
	);
}

function Menu({ label, onPress }: any) {
	return (
		<TouchableOpacity style={styles.item} onPress={onPress}>
			<Text style={styles.text}>{label}</Text>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		justifyContent: "flex-end",
		backgroundColor: "rgba(0,0,0,0.4)",
	},
	sheet: {
		backgroundColor: "#FAF7F2",
		padding: 20,
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
	},
	item: { paddingVertical: 16 },
	text: { fontSize: 16, fontWeight: "600" },
});
