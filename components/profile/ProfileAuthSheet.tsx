import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import {
	KeyboardAvoidingView,
	Modal,
	Platform,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

type Props = {
	visible: boolean;
	onClose: () => void;
	onSwitchToSignup: () => void;
};

export default function ProfileAuthSheet({
	visible,
	onClose,
	onSwitchToSignup,
}: Props) {
	const { signIn } = useAuth();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);

	const handleLogin = async () => {
		if (!email || !password) return;

		try {
			setLoading(true);
			await signIn(email, password);
			onClose();
		} catch (e: any) {
			alert(e.message || "Login failed");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal visible={visible} animationType="slide" transparent>
			<View style={styles.overlay}>
				<KeyboardAvoidingView
					behavior={Platform.OS === "ios" ? "padding" : undefined}
					style={styles.wrapper}
				>
					<View style={styles.sheet}>
						{/* Close */}
						<TouchableOpacity style={styles.closeBtn} onPress={onClose}>
							<Text style={styles.closeText}>✕</Text>
						</TouchableOpacity>

						{/* Logo */}
						<View style={styles.logoWrap}>
							<View style={styles.logoIcon} />
							<Text style={styles.logoText}>Yardr</Text>
						</View>

						<Text style={styles.subtitle}>
							Welcome back! Sign in to continue.
						</Text>

						{/* Form */}
						<View style={styles.form}>
							<Text style={styles.label}>Email</Text>
							<View style={styles.inputWrap}>
								<TextInput
									placeholder="you@example.com"
									placeholderTextColor="#9B948C"
									value={email}
									onChangeText={setEmail}
									autoCapitalize="none"
									keyboardType="email-address"
									style={styles.input}
								/>
							</View>

							<Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
							<View style={styles.inputWrap}>
								<TextInput
									placeholder="••••••••"
									placeholderTextColor="#9B948C"
									value={password}
									onChangeText={setPassword}
									secureTextEntry
									style={styles.input}
								/>
							</View>
						</View>

						{/* Sign In Button */}
						<TouchableOpacity
							style={[
								styles.signInBtn,
								(!email || !password || loading) && { opacity: 0.6 },
							]}
							disabled={!email || !password || loading}
							onPress={handleLogin}
						>
							<Text style={styles.signInText}>
								{loading ? "Signing in…" : "Sign In"}
							</Text>
						</TouchableOpacity>

						{/* Footer */}
						<View style={styles.footer}>
							<Text style={styles.footerText}>Don’t have an account?</Text>
							<TouchableOpacity onPress={onSwitchToSignup}>
								<Text style={styles.footerLink}>Sign up for free</Text>
							</TouchableOpacity>
						</View>
					</View>
				</KeyboardAvoidingView>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.45)",
		justifyContent: "flex-end",
	},

	wrapper: {
		height: "92%",
	},

	sheet: {
		flex: 1,
		backgroundColor: "#FAF7F2",
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		paddingHorizontal: 24,
		paddingTop: 24,
	},

	closeBtn: {
		position: "absolute",
		top: 16,
		right: 20,
		zIndex: 10,
	},

	closeText: {
		fontSize: 22,
		color: "#7B746E",
	},

	logoWrap: {
		alignItems: "center",
		marginTop: 24,
	},

	logoIcon: {
		width: 52,
		height: 52,
		borderRadius: 12,
		backgroundColor: "#E28A4B",
		marginBottom: 12,
	},

	logoText: {
		fontSize: 30,
		fontWeight: "800",
		color: "#E28A4B",
	},

	subtitle: {
		textAlign: "center",
		fontSize: 16,
		color: "#7B746E",
		marginTop: 12,
		marginBottom: 36,
	},

	form: {
		marginTop: 12,
	},

	label: {
		fontSize: 14,
		fontWeight: "600",
		color: "#3A3633",
		marginBottom: 6,
	},

	inputWrap: {
		backgroundColor: "#F1EDE6",
		borderRadius: 14,
		paddingHorizontal: 14,
		height: 52,
		justifyContent: "center",
	},

	input: {
		fontSize: 16,
		color: "#1F1F1F",
	},

	signInBtn: {
		marginTop: 32,
		backgroundColor: "#E28A4B",
		borderRadius: 28,
		height: 56,
		alignItems: "center",
		justifyContent: "center",
	},

	signInText: {
		color: "#FFF",
		fontSize: 18,
		fontWeight: "700",
	},

	footer: {
		marginTop: 28,
		alignItems: "center",
	},

	footerText: {
		color: "#7B746E",
		fontSize: 14,
	},

	footerLink: {
		color: "#E28A4B",
		fontSize: 15,
		fontWeight: "700",
		marginTop: 4,
	},
});
