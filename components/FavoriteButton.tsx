import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useAuth } from "@/contexts/AuthContext";
import { showError, showSignInPrompt } from "@/lib/alerts";
import { favoritesService } from "@/services/favoritesService";

type Variant = "floating" | "inline";

interface FavoriteButtonProps {
	garageSaleId: string;
	size?: number;
	showLabel?: boolean;
	variant?: Variant;
}

const TINT = "#DF6B4F";

export default function FavoriteButton({
	garageSaleId,
	size = 24,
	showLabel = false,
	variant = "inline",
}: FavoriteButtonProps) {
	const { isAuthenticated, user } = useAuth();
	const [isFavorited, setIsFavorited] = useState(false);
	const [loading, setLoading] = useState(false);
	const [scaleAnim] = useState(new Animated.Value(1));

	useEffect(() => {
		if (!isAuthenticated || !user) return;
		favoritesService
			.isFavorited(user.id, garageSaleId)
			.then(setIsFavorited)
			.catch((err) => console.error("Error checking favorite status:", err));
	}, [isAuthenticated, user, garageSaleId]);

	const animateHeart = () => {
		Animated.sequence([
			Animated.spring(scaleAnim, {
				toValue: 1.3,
				friction: 3,
				useNativeDriver: true,
			}),
			Animated.spring(scaleAnim, {
				toValue: 1,
				friction: 3,
				useNativeDriver: true,
			}),
		]).start();
	};

	const handlePress = async () => {
		if (!isAuthenticated) {
			showSignInPrompt(
				router,
				"Please sign in to save your favorite garage sales",
				"Sign In Required",
			);
			return;
		}
		if (!user || loading) return;

		setLoading(true);
		try {
			if (isFavorited) {
				await favoritesService.removeFavorite(user.id, garageSaleId);
				setIsFavorited(false);
			} else {
				await favoritesService.addFavorite(user.id, garageSaleId);
				setIsFavorited(true);
				animateHeart();
			}
		} catch (error: any) {
			console.error("Error toggling favorite:", error);
			showError(error.message || "Failed to update favorite");
		} finally {
			setLoading(false);
		}
	};

	const iconName = isFavorited ? "favorite" : "favorite-border";

	return (
		<TouchableOpacity
			style={[
				variant === "floating" ? styles.floating : styles.inline,
				showLabel && variant === "inline" && styles.inlineWithLabel,
			]}
			onPress={handlePress}
			disabled={loading}
			activeOpacity={0.8}
		>
			<Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
				<MaterialIcons name={iconName} size={size} color={TINT} />
			</Animated.View>
			{showLabel && variant === "inline" && (
				<Text style={styles.label}>{isFavorited ? "Favorited" : "Favorite"}</Text>
			)}
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	floating: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
	},
	inline: {
		alignItems: "center",
		justifyContent: "center",
		padding: 8,
	},
	inlineWithLabel: {
		flexDirection: "row",
		paddingHorizontal: 12,
		paddingVertical: 8,
		backgroundColor: "rgba(223,107,79,0.10)",
		borderRadius: 999,
		borderWidth: 1,
		borderColor: "rgba(223,107,79,0.35)",
	},
	label: {
		marginLeft: 6,
		fontSize: 14,
		fontWeight: "800",
		color: TINT,
	},
});
