import LogoIcon from "@/assets/splash/logo-center.svg";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { sso } from "@/lib/ssoAvailability";
import { authService } from "@/services/authService";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
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
	const colorScheme = useColorScheme();
	const theme = Colors[colorScheme ?? "light"];

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [ssoLoading, setSsoLoading] = useState<"apple" | "google" | null>(null);
	const [appleAvailable, setAppleAvailable] = useState(false);

	useEffect(() => {
		if (!sso.appleNativeAvailable) return;
		try {
			const AppleAuthentication = require("expo-apple-authentication");
			AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
		} catch {
			setAppleAvailable(false);
		}
	}, []);

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

	const handleApple = async () => {
		try {
			setSsoLoading("apple");
			await authService.signInWithApple();
			onClose();
		} catch (e: any) {
			if (e?.code !== "ERR_REQUEST_CANCELED") {
				alert(e.message || "Apple sign-in failed");
			}
		} finally {
			setSsoLoading(null);
		}
	};

	const handleGoogle = async () => {
		try {
			setSsoLoading("google");
			await authService.signInWithGoogle();
			onClose();
		} catch (e: any) {
			if (!String(e?.message || "").includes("cancelled")) {
				alert(e.message || "Google sign-in failed");
			}
		} finally {
			setSsoLoading(null);
		}
	};

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
						{/* Close */}
						<TouchableOpacity style={styles.closeBtn} onPress={onClose}>
							<MaterialIcons name="close" size={22} color={theme.secondaryText} />
						</TouchableOpacity>

						{/* Logo */}
						<View style={styles.logoWrap}>
							<LogoIcon width={52} height={52} />
							<Text style={styles.logoText}>yardr</Text>
						</View>

						<Text style={[styles.subtitle, { color: theme.secondaryText }]}>
							Welcome back! Sign in to continue.
						</Text>

						{/* Form */}
						<View style={styles.form}>
							<Text style={[styles.label, { color: theme.text }]}>Email</Text>
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
								style={[styles.label, { color: theme.text, marginTop: 16 }]}
							>
								Password
							</Text>
							<TextInput
								placeholder="Enter your password"
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

						{/* Sign In Button */}
						<TouchableOpacity
							disabled={!email || !password || loading}
							onPress={handleLogin}
							activeOpacity={0.9}
							style={{ marginTop: 28 }}
						>
							<LinearGradient
								colors={["#DF6B4F", "#F9AD85"]}
								start={{ x: 0, y: 0.5 }}
								end={{ x: 1, y: 0.5 }}
								style={[
									styles.signInBtn,
									(!email || !password || loading) && { opacity: 0.5 },
								]}
							>
								<Text style={styles.signInText}>
									{loading ? "Signing in\u2026" : "Sign In"}
								</Text>
							</LinearGradient>
						</TouchableOpacity>

						{/* Divider + SSO buttons (only when native modules are present) */}
						{(sso.googleNativeAvailable || appleAvailable) ? (
							<>
								<View style={styles.dividerRow}>
									<View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
									<Text style={[styles.dividerText, { color: theme.secondaryText }]}>
										or continue with
									</Text>
									<View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
								</View>

								{Platform.OS === "ios" && appleAvailable ? (
									<TouchableOpacity
										style={styles.appleBtn}
										onPress={handleApple}
										disabled={ssoLoading !== null}
										activeOpacity={0.85}
									>
										{ssoLoading === "apple" ? (
											<ActivityIndicator color="#fff" />
										) : (
											<>
												<MaterialIcons name="apple" size={20} color="#fff" />
												<Text style={styles.appleText}>Continue with Apple</Text>
											</>
										)}
									</TouchableOpacity>
								) : null}

								{sso.googleNativeAvailable ? (
									<TouchableOpacity
										style={[
											styles.googleBtn,
											{ borderColor: theme.border, backgroundColor: theme.background },
										]}
										onPress={handleGoogle}
										disabled={ssoLoading !== null}
										activeOpacity={0.85}
									>
										{ssoLoading === "google" ? (
											<ActivityIndicator color={theme.text} />
										) : (
											<>
												<View style={styles.googleIcon}>
													<Text style={styles.googleG}>G</Text>
												</View>
												<Text style={[styles.googleText, { color: theme.text }]}>
													Continue with Google
												</Text>
											</>
										)}
									</TouchableOpacity>
								) : null}
							</>
						) : null}

						{/* Footer */}
						<View style={styles.footer}>
							<Text style={[styles.footerText, { color: theme.secondaryText }]}>
								Don't have an account?
							</Text>
							<TouchableOpacity onPress={onSwitchToSignup}>
								<Text style={[styles.footerLink, { color: theme.tint }]}>
									Sign up for free
								</Text>
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
		marginTop: 12,
		marginBottom: 36,
	},
	form: { marginTop: 12 },
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
	signInBtn: {
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
	signInText: {
		color: "#FFF",
		fontSize: 18,
		fontWeight: "700",
	},
	dividerRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 24,
		marginBottom: 16,
	},
	dividerLine: {
		flex: 1,
		height: StyleSheet.hairlineWidth,
	},
	dividerText: {
		marginHorizontal: 12,
		fontSize: 12,
		fontWeight: "600",
	},
	appleBtn: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		height: 50,
		borderRadius: 14,
		backgroundColor: "#000",
		marginBottom: 12,
	},
	appleText: {
		color: "#fff",
		fontSize: 15,
		fontWeight: "700",
	},
	googleBtn: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 10,
		height: 50,
		borderRadius: 14,
		borderWidth: 1,
	},
	googleIcon: {
		width: 22,
		height: 22,
		borderRadius: 11,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#4285F4",
	},
	googleG: {
		color: "#fff",
		fontSize: 14,
		fontWeight: "900",
	},
	googleText: {
		fontSize: 15,
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
