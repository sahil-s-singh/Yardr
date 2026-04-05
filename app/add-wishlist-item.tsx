import { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { wishlistService } from '@/services/wishlistService';
import { GarageSaleCategory } from '@/types/garageSale';

const CATEGORIES: GarageSaleCategory[] = [
  'furniture',
  'clothing',
  'electronics',
  'toys',
  'books',
  'tools',
  'kitchen',
  'sports',
  'other',
];

export default function AddWishlistItemScreen() {
  const { user } = useAuth();
  const [itemDescription, setItemDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GarageSaleCategory | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be signed in to add wishlist items');
      return;
    }

    if (!itemDescription.trim()) {
      Alert.alert('Error', 'Please describe what you\'re looking for');
      return;
    }

    setLoading(true);
    try {
      // Use the first line or first 50 chars as the item name
      const lines = itemDescription.trim().split('\n');
      const itemName = lines[0].substring(0, 50);
      const fullDescription = itemDescription.trim();

      await wishlistService.addWishlistItem(
        user.id,
        itemName,
        fullDescription,
        selectedCategory
      );

      Alert.alert(
        'Success',
        "Wishlist item added! We'll notify you when we find matches.",
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error('Error adding wishlist item:', error);
      Alert.alert('Error', error.message || 'Failed to add wishlist item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="subtitle" style={styles.title}>
          What are you looking for?
        </ThemedText>

        <ThemedText style={styles.helperText}>
          Describe the item you want to find at garage sales. Be as specific as you'd like!
        </ThemedText>

        <View style={styles.formGroup}>
          <TextInput
            style={styles.textArea}
            placeholder="e.g., Wine glass set, preferably crystal or lead-free glass, set of 4 or more"
            value={itemDescription}
            onChangeText={setItemDescription}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            placeholderTextColor="#999"
            autoFocus
          />
        </View>

        <View style={styles.formGroup}>
          <ThemedText style={styles.categoryLabel}>Category (optional)</ThemedText>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat && styles.categoryChipSelected,
                ]}
                onPress={() => setSelectedCategory(selectedCategory === cat ? undefined : cat)}
              >
                <ThemedText
                  style={[
                    styles.categoryChipText,
                    selectedCategory === cat && styles.categoryChipTextSelected,
                  ]}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <ThemedText style={styles.submitButtonText}>
            {loading ? 'Adding...' : 'Add to Wishlist'}
          </ThemedText>
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
  },
  title: {
    marginBottom: 12,
  },
  helperText: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 24,
    color: '#666',
  },
  formGroup: {
    marginBottom: 24,
  },
  textArea: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 200,
    textAlignVertical: 'top',
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryChipSelected: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#333',
  },
  categoryChipTextSelected: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#0066FF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
