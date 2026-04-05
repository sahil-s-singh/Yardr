import LogoIcon from "@/assets/splash/logo-center.svg";
import GradientBackground from "@/components/ui/GradientBackground";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { authService } from "@/services/authService";
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

export default function SignInScreen() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const { signIn } = useAuth();
	const colorScheme = useColorScheme();
	const theme = Colors[colorScheme ?? "light"];

	const handleForgotPassword = async () => {
		if (!email.trim()) {
			Alert.alert("Enter Email", "Please enter your email address first, then tap Forgot Password.");
			return;
		}
		try {
			await authService.resetPassword(email.trim());
			Alert.alert(
				"Check Your Email",
				"If an account exists with that email, we've sent password reset instructions."
			);
		} catch (error: any) {
			Alert.alert("Error", error.message || "Failed to send reset email");
		}
	};

	const handleSignIn = async () => {
		if (!email || !password) {
			Alert.alert("Error", "Please enter both email and password");
			return;
		}
		setLoading(true);
		try {
			await signIn(email.trim(), password);
			Alert.alert("Success", "Signed in successfully!");
			router.back();
		} catch (error: any) {
			console.error("Sign in error:", error);
			Alert.alert(
				"Sign In Failed",
				error.message || "Invalid email or password"
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			style={[styles.container, { backgroundColor: theme.background }]}
		>
			<GradientBackground />
			<ScrollView contentContainerStyle={styles.scrollContent}>
				<View style={styles.content}>
					{/* Logo area */}
					<View style={styles.logoArea}>
						<LogoIcon width={56} height={56} />
						<Text style={[styles.brand, { color: theme.text }]}>yardr</Text>
						<Text style={[styles.tagline, { color: theme.secondaryText }]}>
							Find treasures in your neighborhood
						</Text>
					</View>

					{/* Form card */}
					<View style={[styles.formCard, { backgroundColor: theme.card }]}>
						<Text style={[styles.welcomeText, { color: theme.text }]}>
							Welcome back!
						</Text>

						<View style={styles.inputGroup}>
							<Text style={[styles.label, { color: theme.text }]}>Email</Text>
							<TextInput
								style={[
									styles.input,
									{
										backgroundColor: theme.muted,
										color: theme.text,
										borderColor: theme.border,
									},
								]}
								placeholder="you@example.com"
								placeholderTextColor={theme.secondaryText}
								value={email}
								onChangeText={setEmail}
								autoCapitalize="none"
								keyboardType="email-address"
								autoComplete="email"
								editable={!loading}
							/>
						</View>

						<View style={styles.inputGroup}>
							<Text style={[styles.label, { color: theme.text }]}>
								Password
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
									placeholder="Enter your password"
									placeholderTextColor={theme.secondaryText}
									value={password}
									onChangeText={setPassword}
									secureTextEntry={!showPassword}
									editable={!loading}
								/>
								<TouchableOpacity
									style={styles.showButton}
									onPress={() => setShowPassword(!showPassword)}
								>
									<Text style={[styles.showButtonText, { color: theme.tint }]}>
										{showPassword ? "Hide" : "Show"}
									</Text>
								</TouchableOpacity>
							</View>
						</View>

						<TouchableOpacity onPress={handleForgotPassword}>
							<Text style={[styles.forgotText, { color: theme.tint }]}>
								Forgot Password?
							</Text>
						</TouchableOpacity>

						<TouchableOpacity
							onPress={handleSignIn}
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
									{loading ? "Signing In..." : "Sign In"}
								</Text>
							</LinearGradient>
						</TouchableOpacity>
					</View>

					<TouchableOpacity
						onPress={() => router.push("/auth/sign-up")}
						disabled={loading}
						style={styles.linkButton}
					>
						<Text style={[styles.linkText, { color: theme.secondaryText }]}>
							Don&apos;t have an account?{" "}
							<Text style={{ color: theme.tint, fontWeight: "700" }}>
								Sign Up
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
	content: {
		flex: 1,
		padding: 24,
		paddingTop: 80,
	},
	logoArea: {
		alignItems: "center",
		marginBottom: 32,
	},
	brand: {
		fontSize: 34,
		fontWeight: "900",
		letterSpacing: -0.3,
	},
	tagline: {
		fontSize: 15,
		marginTop: 6,
	},
	formCard: {
		borderRadius: 24,
		padding: 24,
		marginBottom: 20,
	},
	welcomeText: {
		fontSize: 24,
		fontWeight: "700",
		marginBottom: 20,
	},
	inputGroup: {
		marginBottom: 16,
	},
	label: {
		marginBottom: 8,
		fontWeight: "600",
		fontSize: 14,
	},
	input: {
		borderWidth: 1,
		borderRadius: 16,
		padding: 16,
		fontSize: 15,
	},
	showButton: {
		position: "absolute",
		right: 16,
		top: 16,
	},
	showButtonText: {
		fontWeight: "700",
		fontSize: 14,
	},
	forgotText: {
		fontWeight: "700",
		fontSize: 14,
		marginBottom: 20,
	},
	button: {
		padding: 18,
		borderRadius: 18,
		alignItems: "center",
		shadowColor: "#DF6B4F",
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.3,
		shadowRadius: 14,
		elevation: 4,
	},
	buttonDisabled: {
		opacity: 0.6,
	},
	buttonText: {
		color: "#fff",
		fontSize: 17,
		fontWeight: "700",
	},
	linkButton: {
		padding: 10,
		alignItems: "center",
	},
	linkText: {
		fontSize: 14,
	},
});
