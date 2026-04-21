import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { wishlistService } from '@/services/wishlistService';
import { WishlistMatchWithDetails } from '@/types/user';

export default function WishlistMatchesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [matches, setMatches] = useState<WishlistMatchWithDetails[]>([]);
  const [wishlistItemName, setWishlistItemName] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (id) {
      loadMatches();
    }
  }, [id]);

  const loadMatches = async () => {
    if (!id) return;

    try {
      const matchesData = await wishlistService.getMatchesForWishlistItem(id);
      setMatches(matchesData);

      if (matchesData.length > 0) {
        setWishlistItemName(matchesData[0].wishlist_item.item_name);
      }
    } catch (error) {
      console.error('Error loading matches:', error);
      Alert.alert('Error', 'Failed to load matches');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadMatches();
  };

  const getConfidenceBadgeColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return '#34c759';
      case 'verified':
        return '#0066FF';
      case 'medium':
        return '#ff9500';
      default:
        return '#8e8e93';
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <ThemedView style={styles.content}>
        {wishlistItemName && (
          <View style={styles.header}>
            <ThemedText style={styles.headerLabel}>Matches for:</ThemedText>
            <ThemedText type="subtitle" style={styles.headerItem}>
              {wishlistItemName}
            </ThemedText>
          </View>
        )}

        {matches.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyIcon}>🔍</ThemedText>
            <ThemedText type="subtitle" style={styles.emptyTitle}>
              No matches yet
            </ThemedText>
            <ThemedText style={styles.emptyText}>
              We'll notify you when garage sales with this item are posted!
            </ThemedText>
          </View>
        ) : (
          <View style={styles.list}>
            {matches.map((match) => (
              <TouchableOpacity
                key={match.id}
                style={styles.matchCard}
                onPress={() => {
                  // Navigate back to map and focus on this sale
                  router.push(`/sale-detail/${match.garage_sale_id}` as any);
                }}
              >
                <View style={styles.matchHeader}>
                  <ThemedText type="defaultSemiBold" style={styles.saleTitle}>
                    {match.garage_sale.title}
                  </ThemedText>
                  <View
                    style={[
                      styles.confidenceBadge,
                      {
                        backgroundColor: getConfidenceBadgeColor(match.match_confidence),
                      },
                    ]}
                  >
                    <ThemedText style={styles.confidenceBadgeText}>
                      {match.match_confidence}
                    </ThemedText>
                  </View>
                </View>

                <ThemedText style={styles.saleDescription} numberOfLines={2}>
                  {match.garage_sale.description}
                </ThemedText>

                {match.match_reason && (
                  <View style={styles.reasonContainer}>
                    <ThemedText style={styles.reasonLabel}>Why it matched:</ThemedText>
                    <ThemedText style={styles.reasonText}>{match.match_reason}</ThemedText>
                  </View>
                )}

                <View style={styles.matchFooter}>
                  <ThemedText style={styles.matchDate}>
                    Matched {new Date(match.matched_at).toLocaleDateString()}
                  </ThemedText>
                  <ThemedText style={styles.viewDetails}>View Details →</ThemedText>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
  },
  header: {
    marginBottom: 24,
  },
  headerLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 4,
    color: '#000',
  },
  headerItem: {
    fontSize: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    paddingHorizontal: 32,
    color: '#000',
  },
  list: {
    gap: 12,
  },
  matchCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  saleTitle: {
    fontSize: 16,
    flex: 1,
    color: '#000',
  },
  confidenceBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  confidenceBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  saleDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
    color: '#000',
  },
  reasonContainer: {
    backgroundColor: '#e8f4ff',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  reasonLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
    opacity: 0.7,
    color: '#000',
  },
  reasonText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#000',
  },
  matchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchDate: {
    fontSize: 12,
    opacity: 0.5,
    color: '#000',
  },
  viewDetails: {
    fontSize: 12,
    color: '#0066FF',
    fontWeight: '600',
  },
});
