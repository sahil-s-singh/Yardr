// app/settings.tsx
import GradientBackground from "@/components/ui/GradientBackground";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { authService } from "@/services/authService";
import { avatarService } from "@/services/avatarService";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	KeyboardAvoidingView,
	Platform,
	SafeAreaView,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

type IdentityProvider = "email" | "google" | "apple" | string;

const PROVIDER_LABELS: Record<string, string> = {
	google: "Google",
	apple: "Apple",
	email: "Email",
};

const PROVIDER_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
	google: "g-translate",
	apple: "apple",
	email: "alternate-email",
};

export default function SettingsScreen() {
	const colorScheme = useColorScheme();
	const theme = Colors[colorScheme ?? "light"];
	const { user, userProfile, refreshProfile } = useAuth();

	const [displayName, setDisplayName] = useState(userProfile?.display_name ?? "");
	const [email, setEmail] = useState(user?.email ?? "");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	const [savingProfile, setSavingProfile] = useState(false);
	const [savingEmail, setSavingEmail] = useState(false);
	const [savingPassword, setSavingPassword] = useState(false);
	const [uploadingAvatar, setUploadingAvatar] = useState(false);
	const [deleting, setDeleting] = useState(false);

	if (!user) {
		return (
			<SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
				<View style={styles.center}>
					<Text style={{ color: theme.text }}>Sign in to access settings.</Text>
				</View>
			</SafeAreaView>
		);
	}

	// Supabase populates user.identities only when fetched via getUser() (not
	// always present on cached sessions). app_metadata.providers is reliable
	// and gets set on every sign-in.
	const meta = (user.app_metadata ?? {}) as {
		provider?: string;
		providers?: string[];
	};
	const identityProviders = (
		(user.identities ?? []) as Array<{ provider: string }>
	).map((i) => i.provider);
	const providers = Array.from(
		new Set(
			[
				...(meta.providers ?? []),
				...(meta.provider ? [meta.provider] : []),
				...identityProviders,
			].filter(Boolean) as string[],
		),
	);
	const hasEmailIdentity = providers.includes("email");
	const ssoProviders = providers.filter((p) => p !== "email");
	const isSsoOnly = !hasEmailIdentity && ssoProviders.length > 0;
	console.log("[Settings] providers:", { providers, hasEmailIdentity, isSsoOnly });

	const handlePickAvatar = async () => {
		const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (!perm.granted) {
			Alert.alert(
				"Permission required",
				"Allow photo library access to set a display picture.",
			);
			return;
		}
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.8,
		});
		if (result.canceled || !result.assets?.[0]) return;
		const asset = result.assets[0];
		setUploadingAvatar(true);
		try {
			const publicUrl = await avatarService.uploadAvatar(user.id, asset.uri);
			await authService.updateUserProfile(user.id, { avatar_url: publicUrl });
			await refreshProfile();
		} catch (err: any) {
			console.error("Avatar update failed:", err);
			Alert.alert("Upload failed", err?.message ?? "Could not update photo");
		} finally {
			setUploadingAvatar(false);
		}
	};

	const handleSaveDisplayName = async () => {
		const trimmed = displayName.trim();
		if (!trimmed) {
			Alert.alert("Display name cannot be empty");
			return;
		}
		setSavingProfile(true);
		try {
			await authService.updateUserProfile(user.id, { display_name: trimmed });
			await refreshProfile();
			Alert.alert("Saved");
		} catch (err: any) {
			Alert.alert("Save failed", err?.message ?? "Try again");
		} finally {
			setSavingProfile(false);
		}
	};

	const handleSaveEmail = async () => {
		const trimmed = email.trim();
		if (!trimmed || !trimmed.includes("@")) {
			Alert.alert("Enter a valid email");
			return;
		}
		if (trimmed === user.email) return;
		setSavingEmail(true);
		try {
			await authService.updateEmail(trimmed);
			Alert.alert(
				"Confirmation sent",
				"Check both your old and new email to confirm the change.",
			);
		} catch (err: any) {
			Alert.alert("Email update failed", err?.message ?? "Try again");
		} finally {
			setSavingEmail(false);
		}
	};

	const handleChangePassword = async () => {
		if (newPassword.length < 6) {
			Alert.alert("Password must be at least 6 characters");
			return;
		}
		if (newPassword !== confirmPassword) {
			Alert.alert("Passwords do not match");
			return;
		}
		setSavingPassword(true);
		try {
			await authService.updatePassword(newPassword);
			setNewPassword("");
			setConfirmPassword("");
			Alert.alert("Password updated");
		} catch (err: any) {
			Alert.alert("Could not update password", err?.message ?? "Try again");
		} finally {
			setSavingPassword(false);
		}
	};

	const handleDeleteAccount = () => {
		Alert.alert(
			"Delete account?",
			"This permanently removes your account, sales, saved items, reminders, and unlinks any connected Google or Apple sign-in. This cannot be undone.",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: () => {
						Alert.alert(
							"Are you sure?",
							"Last chance — your account will be deleted right now.",
							[
								{ text: "Cancel", style: "cancel" },
								{
									text: "Yes, delete",
									style: "destructive",
									onPress: async () => {
										setDeleting(true);
										try {
											await authService.deleteAccount();
											router.replace("/");
										} catch (err: any) {
											console.error("Delete account failed:", err);
											Alert.alert(
												"Could not delete account",
												err?.message ?? "Try again",
											);
										} finally {
											setDeleting(false);
										}
									},
								},
							],
						);
					},
				},
			],
		);
	};

	const avatarUrl = userProfile?.avatar_url;
	const initial =
		(userProfile?.display_name?.[0] ?? user.email?.[0] ?? "?").toUpperCase();

	return (
		<SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
			<GradientBackground />
			<View style={styles.headerRow}>
				<TouchableOpacity onPress={() => router.back()} hitSlop={12}>
					<MaterialIcons name="chevron-left" size={28} color={theme.text} />
				</TouchableOpacity>
				<Text style={[styles.headerTitle, { color: theme.text }]}>
					Settings
				</Text>
				<View style={{ width: 28 }} />
			</View>

			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				style={{ flex: 1 }}
			>
				<ScrollView
					contentContainerStyle={styles.scroll}
					keyboardShouldPersistTaps="handled"
				>
					{/* Avatar */}
					<View style={[styles.card, { backgroundColor: theme.card }]}>
						<TouchableOpacity
							onPress={handlePickAvatar}
							activeOpacity={0.85}
							style={styles.avatarWrap}
							disabled={uploadingAvatar}
						>
							{avatarUrl ? (
								<Image source={{ uri: avatarUrl }} style={styles.avatar} />
							) : (
								<View
									style={[
										styles.avatar,
										styles.avatarFallback,
										{ backgroundColor: theme.muted },
									]}
								>
									<Text style={[styles.avatarInitial, { color: theme.text }]}>
										{initial}
									</Text>
								</View>
							)}
							<View style={[styles.cameraBadge, { backgroundColor: theme.tint }]}>
								{uploadingAvatar ? (
									<ActivityIndicator size="small" color="#fff" />
								) : (
									<MaterialIcons name="photo-camera" size={16} color="#fff" />
								)}
							</View>
						</TouchableOpacity>
						<Text style={[styles.helperText, { color: theme.secondaryText }]}>
							Tap to change photo
						</Text>
					</View>

					{/* Display name */}
					<Section title="Display name" theme={theme}>
						<TextInput
							style={[
								styles.input,
								{
									backgroundColor: theme.card,
									color: theme.text,
									borderColor: theme.border,
								},
							]}
							value={displayName}
							onChangeText={setDisplayName}
							placeholder="Your name"
							placeholderTextColor={theme.secondaryText}
							autoCapitalize="words"
						/>
						<PrimaryButton
							label="Save"
							loading={savingProfile}
							onPress={handleSaveDisplayName}
							theme={theme}
						/>
					</Section>

					{/* Connected accounts (only when SSO is in use) */}
					{ssoProviders.length > 0 ? (
						<Section title="Signed in with" theme={theme}>
							{ssoProviders.map((p) => (
								<View
									key={p}
									style={[
										styles.providerRow,
										{ backgroundColor: theme.card, borderColor: theme.border },
									]}
								>
									<MaterialIcons
										name={PROVIDER_ICONS[p] ?? "verified-user"}
										size={20}
										color={theme.tint}
									/>
									<Text style={[styles.providerLabel, { color: theme.text }]}>
										{PROVIDER_LABELS[p] ?? p}
									</Text>
									<MaterialIcons
										name="check-circle"
										size={18}
										color={theme.tint}
									/>
								</View>
							))}
						</Section>
					) : null}

					{/* Email */}
					<Section title="Email" theme={theme}>
						<TextInput
							style={[
								styles.input,
								{
									backgroundColor: theme.card,
									color: isSsoOnly ? theme.secondaryText : theme.text,
									borderColor: theme.border,
									opacity: isSsoOnly ? 0.7 : 1,
								},
							]}
							value={email}
							onChangeText={setEmail}
							placeholder="you@example.com"
							placeholderTextColor={theme.secondaryText}
							autoCapitalize="none"
							keyboardType="email-address"
							editable={!isSsoOnly}
						/>
						<Text style={[styles.helperText, { color: theme.secondaryText }]}>
							{isSsoOnly
								? `Email is managed by ${ssoProviders.map((p) => PROVIDER_LABELS[p] ?? p).join(" / ")}. Change it from your provider account.`
								: "Changing email sends a confirmation to both addresses."}
						</Text>
						{!isSsoOnly ? (
							<PrimaryButton
								label="Update email"
								loading={savingEmail}
								onPress={handleSaveEmail}
								theme={theme}
							/>
						) : null}
					</Section>

					{/* Password — only if user has email/password identity */}
					{hasEmailIdentity ? (
						<Section title="Change password" theme={theme}>
							<TextInput
								style={[
									styles.input,
									{
										backgroundColor: theme.card,
										color: theme.text,
										borderColor: theme.border,
									},
								]}
								value={newPassword}
								onChangeText={setNewPassword}
								placeholder="New password"
								placeholderTextColor={theme.secondaryText}
								secureTextEntry
								autoCapitalize="none"
							/>
							<TextInput
								style={[
									styles.input,
									{
										backgroundColor: theme.card,
										color: theme.text,
										borderColor: theme.border,
										marginTop: 10,
									},
								]}
								value={confirmPassword}
								onChangeText={setConfirmPassword}
								placeholder="Confirm new password"
								placeholderTextColor={theme.secondaryText}
								secureTextEntry
								autoCapitalize="none"
							/>
							<PrimaryButton
								label="Update password"
								loading={savingPassword}
								onPress={handleChangePassword}
								theme={theme}
							/>
						</Section>
					) : null}

					{/* Danger zone */}
					<Section title="Danger zone" theme={theme}>
						<TouchableOpacity
							style={[styles.dangerButton, { borderColor: "#D14B3C" }]}
							onPress={handleDeleteAccount}
							disabled={deleting}
							activeOpacity={0.8}
						>
							{deleting ? (
								<ActivityIndicator color="#D14B3C" />
							) : (
								<>
									<MaterialIcons
										name="delete-forever"
										size={20}
										color="#D14B3C"
									/>
									<Text style={styles.dangerText}>Delete account</Text>
								</>
							)}
						</TouchableOpacity>
						<Text
							style={[
								styles.helperText,
								{ color: theme.secondaryText, marginTop: 10 },
							]}
						>
							Permanently removes your account, your sales, and unlinks any
							Google/Apple sign-in. This cannot be undone.
						</Text>
					</Section>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

function Section({
	title,
	children,
	theme,
}: {
	title: string;
	children: React.ReactNode;
	theme: any;
}) {
	return (
		<View style={styles.section}>
			<Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>
				{title.toUpperCase()}
			</Text>
			{children}
		</View>
	);
}

function PrimaryButton({
	label,
	loading,
	onPress,
	theme,
}: {
	label: string;
	loading: boolean;
	onPress: () => void;
	theme: any;
}) {
	return (
		<TouchableOpacity
			style={[styles.button, { backgroundColor: theme.tint, opacity: loading ? 0.7 : 1 }]}
			onPress={onPress}
			activeOpacity={0.85}
			disabled={loading}
		>
			{loading ? (
				<ActivityIndicator color="#fff" />
			) : (
				<Text style={styles.buttonText}>{label}</Text>
			)}
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1 },
	headerRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingTop: 4,
		paddingBottom: 8,
	},
	headerTitle: { fontSize: 18, fontWeight: "800" },
	center: { flex: 1, alignItems: "center", justifyContent: "center" },
	scroll: {
		paddingHorizontal: 20,
		paddingBottom: 60,
	},
	card: {
		borderRadius: 20,
		padding: 20,
		alignItems: "center",
		marginBottom: 16,
	},
	avatarWrap: {
		position: "relative",
	},
	avatar: {
		width: 96,
		height: 96,
		borderRadius: 48,
	},
	avatarFallback: {
		alignItems: "center",
		justifyContent: "center",
	},
	avatarInitial: {
		fontSize: 36,
		fontWeight: "800",
	},
	cameraBadge: {
		position: "absolute",
		right: 0,
		bottom: 0,
		width: 30,
		height: 30,
		borderRadius: 15,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 2,
		borderColor: "#fff",
	},
	section: {
		marginBottom: 18,
	},
	sectionTitle: {
		fontSize: 11,
		fontWeight: "800",
		letterSpacing: 0.6,
		marginBottom: 8,
		paddingHorizontal: 4,
	},
	input: {
		borderRadius: 12,
		borderWidth: 1,
		paddingHorizontal: 14,
		paddingVertical: 12,
		fontSize: 15,
	},
	helperText: {
		fontSize: 12,
		marginTop: 8,
		marginBottom: 4,
		paddingHorizontal: 4,
	},
	providerRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingVertical: 14,
		paddingHorizontal: 16,
		borderRadius: 12,
		borderWidth: 1,
		marginBottom: 8,
	},
	providerLabel: {
		flex: 1,
		fontSize: 15,
		fontWeight: "700",
	},
	dangerButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		paddingVertical: 14,
		borderRadius: 12,
		borderWidth: 1.5,
		backgroundColor: "transparent",
	},
	dangerText: {
		color: "#D14B3C",
		fontSize: 15,
		fontWeight: "800",
	},
	button: {
		marginTop: 12,
		paddingVertical: 12,
		borderRadius: 12,
		alignItems: "center",
	},
	buttonText: {
		color: "#fff",
		fontSize: 15,
		fontWeight: "800",
	},
});
