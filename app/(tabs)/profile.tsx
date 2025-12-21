import { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { favoritesService } from '@/services/favoritesService';
import { remindersService } from '@/services/remindersService';

export default function ProfileScreen() {
  const { isAuthenticated, user, userProfile, signOut } = useAuth();
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [remindersCount, setRemindersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadStats();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const loadStats = async () => {
    if (!user) return;

    try {
      const [favorites, reminders] = await Promise.all([
        favoritesService.getFavoritesCount(user.id),
        remindersService.getRemindersCount(user.id),
      ]);

      setFavoritesCount(favorites);
      setRemindersCount(reminders);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            Alert.alert('Success', 'Signed out successfully');
          } catch (error) {
            Alert.alert('Error', 'Failed to sign out');
          }
        },
      },
    ]);
  };

  if (!isAuthenticated) {
    // Guest view
    return (
      <ScrollView style={styles.container}>
        <ThemedView style={styles.content}>
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              Profile
            </ThemedText>
          </View>

          {/* My Sales - Available for everyone */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              My Listings
            </ThemedText>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/my-sales')}
            >
              <ThemedText style={styles.menuIcon}>📦</ThemedText>
              <ThemedText style={styles.menuText}>My Garage Sales</ThemedText>
              <ThemedText style={styles.menuArrow}>›</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.guestCard}>
            <ThemedText type="subtitle" style={styles.guestTitle}>
              Welcome to Yardr!
            </ThemedText>
            <ThemedText style={styles.guestText}>
              Sign in to unlock these features:
            </ThemedText>

            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <ThemedText style={styles.featureIcon}>❤️</ThemedText>
                <ThemedText style={styles.featureText}>Save favorite garage sales</ThemedText>
              </View>
              <View style={styles.featureItem}>
                <ThemedText style={styles.featureIcon}>🔔</ThemedText>
                <ThemedText style={styles.featureText}>Set reminders for upcoming sales</ThemedText>
              </View>
              <View style={styles.featureItem}>
                <ThemedText style={styles.featureIcon}>📜</ThemedText>
                <ThemedText style={styles.featureText}>Track your viewing history</ThemedText>
              </View>
              <View style={styles.featureItem}>
                <ThemedText style={styles.featureIcon}>⭐</ThemedText>
                <ThemedText style={styles.featureText}>Get notified when wishlist items appear</ThemedText>
              </View>
              <View style={styles.featureItem}>
                <ThemedText style={styles.featureIcon}>☁️</ThemedText>
                <ThemedText style={styles.featureText}>Sync your sales across all devices</ThemedText>
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/auth/sign-in')}
            >
              <ThemedText style={styles.primaryButtonText}>Sign In</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/auth/sign-up')}
            >
              <ThemedText style={styles.secondaryButtonText}>Create Account</ThemedText>
            </TouchableOpacity>

            <ThemedText style={styles.guestNote}>
              You can still browse and create garage sales without an account!
            </ThemedText>
          </View>
        </ThemedView>
      </ScrollView>
    );
  }

  // Authenticated view
  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Profile
          </ThemedText>
        </View>

        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <ThemedText style={styles.avatarText}>
                {(userProfile?.display_name || user?.email || 'U')[0].toUpperCase()}
              </ThemedText>
            </View>
          </View>
          <ThemedText type="subtitle" style={styles.displayName}>
            {userProfile?.display_name || 'User'}
          </ThemedText>
          <ThemedText style={styles.email}>{user?.email}</ThemedText>
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>{favoritesCount}</ThemedText>
            <ThemedText style={styles.statLabel}>Favorites</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>{remindersCount}</ThemedText>
            <ThemedText style={styles.statLabel}>Reminders</ThemedText>
          </View>
        </View>

        {/* Navigation Menu */}
        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/favorites')}
          >
            <View style={styles.menuItemLeft}>
              <ThemedText style={styles.menuIcon}>❤️</ThemedText>
              <ThemedText style={styles.menuText}>My Favorites</ThemedText>
            </View>
            <ThemedText style={styles.menuChevron}>›</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/reminders')}
          >
            <View style={styles.menuItemLeft}>
              <ThemedText style={styles.menuIcon}>🔔</ThemedText>
              <ThemedText style={styles.menuText}>My Reminders</ThemedText>
            </View>
            <ThemedText style={styles.menuChevron}>›</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/history')}
          >
            <View style={styles.menuItemLeft}>
              <ThemedText style={styles.menuIcon}>📜</ThemedText>
              <ThemedText style={styles.menuText}>View History</ThemedText>
            </View>
            <ThemedText style={styles.menuChevron}>›</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/wishlists')}
          >
            <View style={styles.menuItemLeft}>
              <ThemedText style={styles.menuIcon}>⭐</ThemedText>
              <ThemedText style={styles.menuText}>My Wishlist</ThemedText>
            </View>
            <ThemedText style={styles.menuChevron}>›</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/my-sales')}
          >
            <View style={styles.menuItemLeft}>
              <ThemedText style={styles.menuIcon}>📍</ThemedText>
              <ThemedText style={styles.menuText}>My Garage Sales</ThemedText>
            </View>
            <ThemedText style={styles.menuChevron}>›</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Debug Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Developer Tools
          </ThemedText>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/test-notification')}
          >
            <View style={styles.menuItemLeft}>
              <ThemedText style={styles.menuIcon}>🔔</ThemedText>
              <ThemedText style={styles.menuText}>Test Notifications</ThemedText>
            </View>
            <ThemedText style={styles.menuChevron}>›</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    textAlign: 'center',
  },
  guestCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  guestTitle: {
    marginBottom: 12,
    textAlign: 'center',
  },
  guestText: {
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 20,
    color: '#000',
  },
  featureList: {
    width: '100%',
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingLeft: 8,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },
  primaryButton: {
    backgroundColor: '#0066FF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0066FF',
    width: '100%',
    marginBottom: 16,
  },
  secondaryButtonText: {
    color: '#0066FF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  guestNote: {
    textAlign: 'center',
    fontSize: 12,
    opacity: 0.6,
    marginTop: 8,
    color: '#000',
  },
  userCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    color: '#fff',
    fontWeight: 'bold',
  },
  displayName: {
    marginBottom: 4,
  },
  email: {
    opacity: 0.7,
    fontSize: 14,
    color: '#000',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0066FF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.7,
    color: '#000',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#ddd',
  },
  menuSection: {
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
    color: '#000',
  },
  menuChevron: {
    fontSize: 24,
    opacity: 0.5,
  },
  signOutButton: {
    backgroundColor: '#ff3b30',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
