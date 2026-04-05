import LogoIcon from "@/assets/splash/logo-center.svg";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
	KeyboardAvoidingView,
	Modal,
	Platform,
	ScrollView,
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
	const colorScheme = useColorScheme();
	const theme = Colors[colorScheme ?? "light"];

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

	const canSubmit = email && password && displayName && !loading;

	return (
		<Modal visible={visible} animationType="slide" transparent>
			<View style={styles.overlay}>
				<KeyboardAvoidingView
					behavior={Platform.OS === "ios" ? "padding" : undefined}
					style={styles.wrapper}
				>
					<View
						style={[styles.sheet, { backgroundColor: theme.background }]}
					>
						<TouchableOpacity style={styles.closeBtn} onPress={onClose}>
							<MaterialIcons name="close" size={22} color={theme.secondaryText} />
						</TouchableOpacity>

						<ScrollView showsVerticalScrollIndicator={false}>
							<View style={styles.logoWrap}>
								<LogoIcon width={52} height={52} />
								<Text style={styles.logoText}>yardr</Text>
							</View>

							<Text
								style={[styles.subtitle, { color: theme.secondaryText }]}
							>
								Create your account
							</Text>

							<View style={styles.form}>
								<Text style={[styles.label, { color: theme.text }]}>
									Display name
								</Text>
								<TextInput
									placeholder="Your name"
									placeholderTextColor={theme.secondaryText}
									value={displayName}
									onChangeText={setDisplayName}
									style={[
										styles.input,
										{
											backgroundColor: theme.muted,
											color: theme.text,
											borderColor: theme.border,
										},
									]}
								/>

								<Text
									style={[
										styles.label,
										{ color: theme.text, marginTop: 14 },
									]}
								>
									Email
								</Text>
								<TextInput
									placeholder="you@example.com"
									placeholderTextColor={theme.secondaryText}
									value={email}
									onChangeText={setEmail}
									autoCapitalize="none"
									keyboardType="email-address"
									style={[
										styles.input,
										{
											backgroundColor: theme.muted,
											color: theme.text,
											borderColor: theme.border,
										},
									]}
								/>

								<Text
									style={[
										styles.label,
										{ color: theme.text, marginTop: 14 },
									]}
								>
									Password
								</Text>
								<TextInput
									placeholder="Min 6 characters"
									placeholderTextColor={theme.secondaryText}
									value={password}
									onChangeText={setPassword}
									secureTextEntry
									style={[
										styles.input,
										{
											backgroundColor: theme.muted,
											color: theme.text,
											borderColor: theme.border,
										},
									]}
								/>
							</View>

							<TouchableOpacity
								disabled={!canSubmit}
								onPress={handleSignup}
								activeOpacity={0.9}
								style={{ marginTop: 28 }}
							>
								<LinearGradient
									colors={["#DF6B4F", "#F9AD85"]}
									start={{ x: 0, y: 0.5 }}
									end={{ x: 1, y: 0.5 }}
									style={[
										styles.signUpBtn,
										!canSubmit && { opacity: 0.5 },
									]}
								>
									<Text style={styles.signUpText}>
										{loading ? "Creating account\u2026" : "Sign Up"}
									</Text>
								</LinearGradient>
							</TouchableOpacity>

							<View style={styles.footer}>
								<Text
									style={[
										styles.footerText,
										{ color: theme.secondaryText },
									]}
								>
									Already have an account?
								</Text>
								<TouchableOpacity onPress={onSwitchToLogin}>
									<Text style={[styles.footerLink, { color: theme.tint }]}>
										Sign in
									</Text>
								</TouchableOpacity>
							</View>

							<View style={{ height: 40 }} />
						</ScrollView>
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
	logoWrap: {
		alignItems: "center",
		marginTop: 24,
	},
	logoText: {
		fontSize: 30,
		fontWeight: "900",
		color: "#DF6B4F",
		marginTop: 8,
		letterSpacing: -0.3,
	},
	subtitle: {
		textAlign: "center",
		fontSize: 16,
		marginVertical: 24,
	},
	form: { marginTop: 8 },
	label: {
		fontSize: 14,
		fontWeight: "600",
		marginBottom: 8,
	},
	input: {
		borderWidth: 1,
		borderRadius: 16,
		padding: 16,
		fontSize: 15,
	},
	signUpBtn: {
		borderRadius: 18,
		height: 56,
		alignItems: "center",
		justifyContent: "center",
		shadowColor: "#DF6B4F",
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.3,
		shadowRadius: 14,
		elevation: 4,
	},
	signUpText: {
		color: "#FFF",
		fontSize: 18,
		fontWeight: "700",
	},
	footer: {
		marginTop: 28,
		alignItems: "center",
	},
	footerText: { fontSize: 14 },
	footerLink: {
		fontSize: 15,
		fontWeight: "700",
		marginTop: 4,
	},
});
