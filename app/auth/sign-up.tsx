import { useAuth } from "@/contexts/AuthContext";
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

	const handleSignUp = async () => {
		// Validation
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
				[
					{
						text: "OK",
						onPress: () => router.push("/auth/sign-in"),
					},
				]
			);
		} catch (error: any) {
			console.error("Sign up error:", error);
			Alert.alert(
				"Sign Up Failed",
				error.message || "Could not create account"
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			style={styles.container}
		>
			<ScrollView contentContainerStyle={styles.scrollContent}>
				<View style={styles.content}>
					<Text style={styles.title}>Create Account</Text>
					<Text style={styles.subtitle}>
						Join Yardr to save favorites and get reminders
					</Text>

					<View style={styles.form}>
						<View style={styles.inputContainer}>
							<Text style={styles.label}>
								Display Name <Text style={styles.optional}>(optional)</Text>
							</Text>
							<TextInput
								style={styles.input}
								placeholder="Your name"
								placeholderTextColor="#999"
								value={displayName}
								onChangeText={setDisplayName}
								autoCapitalize="words"
								editable={!loading}
							/>
						</View>

						<View style={styles.inputContainer}>
							<Text style={styles.label}>Email</Text>
							<TextInput
								style={styles.input}
								placeholder="your@email.com"
								placeholderTextColor="#999"
								value={email}
								onChangeText={setEmail}
								autoCapitalize="none"
								keyboardType="email-address"
								autoComplete="email"
								editable={!loading}
							/>
						</View>

						<View style={styles.inputContainer}>
							<Text style={styles.label}>Password</Text>
							<TextInput
								style={styles.input}
								placeholder="At least 6 characters"
								placeholderTextColor="#999"
								value={password}
								onChangeText={setPassword}
								secureTextEntry={!showPassword}
								editable={!loading}
							/>
							<TouchableOpacity
								style={styles.showButton}
								onPress={() => setShowPassword(!showPassword)}
							>
								<Text style={styles.showButtonText}>
									{showPassword ? "Hide" : "Show"}
								</Text>
							</TouchableOpacity>
						</View>

						<View style={styles.inputContainer}>
							<Text style={styles.label}>Confirm Password</Text>
							<TextInput
								style={styles.input}
								placeholder="Re-enter your password"
								placeholderTextColor="#999"
								value={confirmPassword}
								onChangeText={setConfirmPassword}
								secureTextEntry={!showConfirmPassword}
								editable={!loading}
							/>
							<TouchableOpacity
								style={styles.showButton}
								onPress={() => setShowConfirmPassword(!showConfirmPassword)}
							>
								<Text style={styles.showButtonText}>
									{showConfirmPassword ? "Hide" : "Show"}
								</Text>
							</TouchableOpacity>
						</View>

						<TouchableOpacity
							style={[styles.button, loading && styles.buttonDisabled]}
							onPress={handleSignUp}
							disabled={loading}
						>
							<Text style={styles.buttonText}>
								{loading ? "Creating Account..." : "Create Account"}
							</Text>
						</TouchableOpacity>

						<View style={styles.divider} />

						<TouchableOpacity
							onPress={() => router.push("/auth/sign-in")}
							disabled={loading}
							style={styles.linkButton}
						>
							<Text style={styles.linkText}>
								Already have an account?{" "}
								<Text style={styles.linkTextBold}>Sign In</Text>
							</Text>
						</TouchableOpacity>

						<TouchableOpacity
							onPress={() => router.back()}
							disabled={loading}
							style={styles.linkButton}
						>
							<Text style={styles.linkText}>Continue as Guest</Text>
						</TouchableOpacity>
					</View>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
	},
	scrollContent: {
		flexGrow: 1,
	},
	content: {
		flex: 1,
		padding: 20,
		paddingTop: 60,
		justifyContent: "center",
		backgroundColor: "#fff",
	},
	title: {
		fontSize: 32,
		fontWeight: "bold",
		marginBottom: 10,
		textAlign: "center",
		color: "#000",
	},
	subtitle: {
		textAlign: "center",
		opacity: 0.7,
		marginBottom: 40,
		color: "#000",
	},
	form: {
		width: "100%",
	},
	inputContainer: {
		marginBottom: 20,
	},
	label: {
		marginBottom: 8,
		fontWeight: "600",
		color: "#000",
	},
	optional: {
		opacity: 0.6,
		fontWeight: "normal",
	},
	input: {
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 8,
		padding: 15,
		fontSize: 16,
		backgroundColor: "#fff",
		color: "#000",
	},
	showButton: {
		marginTop: 8,
		alignSelf: "flex-end",
	},
	showButtonText: {
		color: "#0066FF",
		fontWeight: "600",
	},
	button: {
		backgroundColor: "#0066FF",
		padding: 16,
		borderRadius: 8,
		alignItems: "center",
		marginTop: 10,
	},
	buttonDisabled: {
		opacity: 0.6,
	},
	buttonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "bold",
	},
	divider: {
		height: 1,
		backgroundColor: "#e0e0e0",
		marginVertical: 30,
	},
	linkButton: {
		padding: 10,
		alignItems: "center",
	},
	linkText: {
		fontSize: 14,
		opacity: 0.8,
		color: "#000",
	},
	linkTextBold: {
		fontWeight: "bold",
		color: "#0066FF",
	},
});
