import LogoIcon from "@/assets/splash/logo-center.svg";
import GradientBackground from "@/components/ui/GradientBackground";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
	Alert,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

export default function SignUpScreen() {
	const [displayName, setDisplayName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const { signUp } = useAuth();
	const colorScheme = useColorScheme();
	const theme = Colors[colorScheme ?? "light"];

	const handleSignUp = async () => {
		if (!email || !password) {
			Alert.alert("Error", "Please enter both email and password");
			return;
		}
		if (password.length < 6) {
			Alert.alert("Error", "Password must be at least 6 characters");
			return;
		}
		if (password !== confirmPassword) {
			Alert.alert("Error", "Passwords do not match");
			return;
		}
		setLoading(true);
		try {
			await signUp(email.trim(), password, displayName.trim() || undefined);
			Alert.alert(
				"Success",
				"Account created! Please check your email to verify your account.",
				[{ text: "OK", onPress: () => router.push("/auth/sign-in") }]
			);
		} catch (error: any) {
			Alert.alert(
				"Sign Up Failed",
				error.message || "Could not create account"
			);
		} finally {
			setLoading(false);
		}
	};

	const renderInput = (
		label: string,
		value: string,
		onChange: (t: string) => void,
		placeholder: string,
		options?: {
			secure?: boolean;
			showToggle?: boolean;
			shown?: boolean;
			onToggle?: () => void;
			keyboard?: "email-address";
			autoCapitalize?: "none" | "words";
			optional?: boolean;
		}
	) => (
		<View style={styles.inputGroup}>
			<Text style={[styles.label, { color: theme.text }]}>
				{label}
				{options?.optional && (
					<Text style={{ color: theme.secondaryText, fontWeight: "400" }}>
						{" "}
						(optional)
					</Text>
				)}
			</Text>
			<View>
				<TextInput
					style={[
						styles.input,
						{
							backgroundColor: theme.muted,
							color: theme.text,
							borderColor: theme.border,
						},
					]}
					placeholder={placeholder}
					placeholderTextColor={theme.secondaryText}
					value={value}
					onChangeText={onChange}
					secureTextEntry={options?.secure && !options?.shown}
					autoCapitalize={options?.autoCapitalize ?? "none"}
					keyboardType={options?.keyboard}
					editable={!loading}
				/>
				{options?.showToggle && (
					<TouchableOpacity
						style={styles.showButton}
						onPress={options.onToggle}
					>
						<Text style={[styles.showButtonText, { color: theme.tint }]}>
							{options.shown ? "Hide" : "Show"}
						</Text>
					</TouchableOpacity>
				)}
			</View>
		</View>
	);

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			style={[styles.container, { backgroundColor: theme.background }]}
		>
			<GradientBackground />
			<ScrollView contentContainerStyle={styles.scrollContent}>
				<View style={styles.content}>
					<View style={styles.logoArea}>
						<LogoIcon width={56} height={56} />
						<Text style={[styles.brand, { color: theme.text }]}>yardr</Text>
						<Text style={[styles.tagline, { color: theme.secondaryText }]}>
							Create your account
						</Text>
					</View>

					<View style={[styles.formCard, { backgroundColor: theme.card }]}>
						{renderInput("Display Name", displayName, setDisplayName, "Your name", {
							autoCapitalize: "words",
							optional: true,
						})}
						{renderInput("Email", email, setEmail, "you@example.com", {
							keyboard: "email-address",
						})}
						{renderInput("Password", password, setPassword, "Min 6 characters", {
							secure: true,
							showToggle: true,
							shown: showPassword,
							onToggle: () => setShowPassword(!showPassword),
						})}
						{renderInput(
							"Confirm Password",
							confirmPassword,
							setConfirmPassword,
							"Re-enter password",
							{
								secure: true,
								showToggle: true,
								shown: showConfirmPassword,
								onToggle: () => setShowConfirmPassword(!showConfirmPassword),
							}
						)}

						<TouchableOpacity
							onPress={handleSignUp}
							disabled={loading}
							activeOpacity={0.9}
						>
							<LinearGradient
								colors={["#DF6B4F", "#F9AD85"]}
								start={{ x: 0, y: 0.5 }}
								end={{ x: 1, y: 0.5 }}
								style={[styles.button, loading && styles.buttonDisabled]}
							>
								<Text style={styles.buttonText}>
									{loading ? "Creating Account..." : "Create Account"}
								</Text>
							</LinearGradient>
						</TouchableOpacity>
					</View>

					<TouchableOpacity
						onPress={() => router.push("/auth/sign-in")}
						disabled={loading}
						style={styles.linkButton}
					>
						<Text style={[styles.linkText, { color: theme.secondaryText }]}>
							Already have an account?{" "}
							<Text style={{ color: theme.tint, fontWeight: "700" }}>
								Sign In
							</Text>
						</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	scrollContent: { flexGrow: 1 },
	content: { flex: 1, padding: 24, paddingTop: 60 },
	logoArea: { alignItems: "center", marginBottom: 28 },
	brand: { fontSize: 34, fontWeight: "900", letterSpacing: -0.3, marginTop: 12 },
	tagline: { fontSize: 15, marginTop: 6 },
	formCard: { borderRadius: 24, padding: 24, marginBottom: 20 },
	inputGroup: { marginBottom: 14 },
	label: { marginBottom: 8, fontWeight: "600", fontSize: 14 },
	input: { borderWidth: 1, borderRadius: 16, padding: 16, fontSize: 15 },
	showButton: { position: "absolute", right: 16, top: 16 },
	showButtonText: { fontWeight: "700", fontSize: 14 },
	button: {
		padding: 18,
		borderRadius: 18,
		alignItems: "center",
		marginTop: 8,
		shadowColor: "#DF6B4F",
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.3,
		shadowRadius: 14,
		elevation: 4,
	},
	buttonDisabled: { opacity: 0.6 },
	buttonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
	linkButton: { padding: 10, alignItems: "center" },
	linkText: { fontSize: 14 },
});
