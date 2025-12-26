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

export default function ProfileSignupSheet({
	visible,
	onClose,
	onSwitchToLogin,
}: {
	visible: boolean;
	onClose: () => void;
	onSwitchToLogin: () => void;
}) {
	const { signUp } = useAuth();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [displayName, setDisplayName] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSignup = async () => {
		if (!email || !password || !displayName) return;

		try {
			setLoading(true);
			await signUp(email, password, displayName);
			onClose();
		} catch (e: any) {
			alert(e.message || "Signup failed");
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
						<TouchableOpacity style={styles.closeBtn} onPress={onClose}>
							<Text style={styles.closeText}>✕</Text>
						</TouchableOpacity>

						<View style={styles.logoWrap}>
							<View style={styles.logoIcon} />
							<Text style={styles.logoText}>Yardr</Text>
						</View>

						<Text style={styles.subtitle}>Create your account</Text>

						<View style={styles.form}>
							<Text style={styles.label}>Display name</Text>
							<View style={styles.inputWrap}>
								<TextInput
									placeholder="John Doe"
									placeholderTextColor="#9B948C"
									value={displayName}
									onChangeText={setDisplayName}
									style={styles.input}
								/>
							</View>

							<Text style={[styles.label, { marginTop: 14 }]}>Email</Text>
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

							<Text style={[styles.label, { marginTop: 14 }]}>Password</Text>
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

						<TouchableOpacity
							style={[
								styles.signUpBtn,
								(!email || !password || !displayName || loading) && {
									opacity: 0.6,
								},
							]}
							disabled={!email || !password || !displayName || loading}
							onPress={handleSignup}
						>
							<Text style={styles.signUpText}>
								{loading ? "Creating account…" : "Sign Up"}
							</Text>
						</TouchableOpacity>

						<View style={styles.footer}>
							<Text style={styles.footerText}>Already have an account?</Text>
							<TouchableOpacity onPress={onSwitchToLogin}>
								<Text style={styles.footerLink}>Sign in</Text>
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
	wrapper: { height: "92%" },
	sheet: {
		flex: 1,
		backgroundColor: "#FAF7F2",
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		paddingHorizontal: 24,
		paddingTop: 24,
	},
	closeBtn: { position: "absolute", top: 16, right: 20 },
	closeText: { fontSize: 22, color: "#7B746E" },

	logoWrap: { alignItems: "center", marginTop: 24 },
	logoIcon: {
		width: 52,
		height: 52,
		borderRadius: 12,
		backgroundColor: "#E28A4B",
		marginBottom: 12,
	},
	logoText: { fontSize: 30, fontWeight: "800", color: "#E28A4B" },

	subtitle: {
		textAlign: "center",
		fontSize: 16,
		color: "#7B746E",
		marginVertical: 24,
	},

	form: { marginTop: 8 },
	label: { fontSize: 14, fontWeight: "600", color: "#3A3633" },
	inputWrap: {
		backgroundColor: "#F1EDE6",
		borderRadius: 14,
		paddingHorizontal: 14,
		height: 52,
		justifyContent: "center",
		marginTop: 6,
	},
	input: { fontSize: 16 },

	signUpBtn: {
		marginTop: 32,
		backgroundColor: "#E28A4B",
		borderRadius: 28,
		height: 56,
		alignItems: "center",
		justifyContent: "center",
	},
	signUpText: { color: "#FFF", fontSize: 18, fontWeight: "700" },

	footer: { marginTop: 28, alignItems: "center" },
	footerText: { color: "#7B746E", fontSize: 14 },
	footerLink: {
		color: "#E28A4B",
		fontSize: 15,
		fontWeight: "700",
		marginTop: 4,
	},
});
