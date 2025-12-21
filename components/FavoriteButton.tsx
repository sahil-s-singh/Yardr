import { useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthContext';
import { favoritesService } from '@/services/favoritesService';
import { showSignInPrompt, showError } from '@/lib/alerts';

interface FavoriteButtonProps {
  garageSaleId: string;
  size?: number;
  showLabel?: boolean;
}

export default function FavoriteButton({
  garageSaleId,
  size = 24,
  showLabel = false,
}: FavoriteButtonProps) {
  const { isAuthenticated, user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (isAuthenticated && user) {
      checkFavoriteStatus();
    }
  }, [isAuthenticated, user, garageSaleId]);

  const checkFavoriteStatus = async () => {
    if (!user) return;

    try {
      const favorited = await favoritesService.isFavorited(user.id, garageSaleId);
      setIsFavorited(favorited);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

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
        'Please sign in to save your favorite garage sales',
        'Sign In Required'
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
      console.error('Error toggling favorite:', error);
      showError(error.message || 'Failed to update favorite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, showLabel && styles.buttonWithLabel]}
      onPress={handlePress}
      disabled={loading}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <ThemedText style={[styles.icon, { fontSize: size }]}>
          {isFavorited ? '❤️' : '🤍'}
        </ThemedText>
      </Animated.View>
      {showLabel && (
        <ThemedText style={styles.label}>
          {isFavorited ? 'Favorited' : 'Favorite'}
        </ThemedText>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  buttonWithLabel: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
  },
  icon: {
    textAlign: 'center',
  },
  label: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
  },
});
