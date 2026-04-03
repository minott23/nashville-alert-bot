import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii } from '../../theme/colors';
import { fetchNearbyPlaces, CATEGORIES, getPhotoUrl } from '../../services/placesService';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { getDistance } from '../../utils/time';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W * 0.68;

function StarRating({ rating, size = 12 }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {stars.map(s => (
        <Ionicons
          key={s}
          name={s <= Math.floor(rating) ? 'star' : s - 0.5 <= rating ? 'star-half' : 'star-outline'}
          size={size}
          color="#F1C40F"
        />
      ))}
    </View>
  );
}

function BusinessCard({ place, onPress, userLocation }) {
  const dist = userLocation
    ? getDistance(userLocation.latitude, userLocation.longitude, place.latitude, place.longitude)
    : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Photo */}
      <View style={styles.cardImageWrap}>
        {place.photoRef ? (
          <Image source={{ uri: getPhotoUrl(place.photoRef, 400) }} style={styles.cardImage} />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Ionicons name="image-outline" size={36} color={Colors.textDim} />
          </View>
        )}
        {/* Open/Closed tag */}
        {place.isOpenNow !== null && (
          <View style={[styles.openTag, { backgroundColor: place.isOpenNow ? '#1a4a2a' : '#4a1a1a' }]}>
            <View style={[styles.openDot, { backgroundColor: place.isOpenNow ? Colors.success : Colors.error }]} />
            <Text style={[styles.openText, { color: place.isOpenNow ? Colors.success : Colors.error }]}>
              {place.isOpenNow ? 'Open' : 'Closed'}
            </Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>{place.name}</Text>
        <View style={styles.ratingRow}>
          <StarRating rating={place.rating} />
          <Text style={styles.ratingText}>{place.rating.toFixed(1)}</Text>
          <Text style={styles.reviewCount}>({place.reviewCount.toLocaleString()})</Text>
        </View>
        <View style={styles.cardMeta}>
          {dist !== null && (
            <View style={styles.distRow}>
              <Ionicons name="location-outline" size={11} color={Colors.textDim} />
              <Text style={styles.distText}>{dist < 0.1 ? 'Nearby' : `${dist.toFixed(1)} mi`}</Text>
            </View>
          )}
          {place.priceLevel > 0 && (
            <Text style={styles.priceText}>{'$'.repeat(place.priceLevel)}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function PlacesScreen({ navigation }) {
  const { location } = useApp();
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [places, setPlaces] = useState({});
  const [loading, setLoading] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (location) {
      CATEGORIES.forEach(cat => loadPlaces(cat, location));
    }
  }, [location]);

  async function loadPlaces(category, loc) {
    if (!loc) return;
    setLoading(prev => ({ ...prev, [category.id]: true }));
    try {
      const results = await fetchNearbyPlaces(loc.latitude, loc.longitude, category.type);
      setPlaces(prev => ({ ...prev, [category.id]: results }));
    } catch {}
    setLoading(prev => ({ ...prev, [category.id]: false }));
  }

  async function handleRefresh() {
    setRefreshing(true);
    if (location) {
      await loadPlaces(activeCategory, location);
    }
    setRefreshing(false);
  }

  const currentPlaces = places[activeCategory.id] || [];
  const isLoading = loading[activeCategory.id];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Places</Text>
          {location && (
            <View style={styles.locationTag}>
              <Ionicons name="location" size={11} color={Colors.primaryRed} />
              <Text style={styles.locationTagText}>Nashville</Text>
            </View>
          )}
        </View>
      </View>

      {/* Category tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catScroll}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.catTab, activeCategory.id === cat.id && styles.catTabActive]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text style={[styles.catText, activeCategory.id === cat.id && styles.catTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Places list */}
      {isLoading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={Colors.primaryRed} size="large" />
          <Text style={styles.loadingText}>Finding places near you…</Text>
        </View>
      ) : (
        <FlatList
          data={currentPlaces}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <BusinessCard
              place={item}
              userLocation={location}
              onPress={() => navigation.navigate('PlaceDetail', { place: item, category: activeCategory })}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primaryRed}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="compass-outline" size={48} color={Colors.textDim} />
              <Text style={styles.emptyTitle}>No places found</Text>
              <Text style={styles.emptySub}>Try refreshing or check your location settings</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDim,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: {
    color: Colors.text,
    fontSize: Typography.fontSizes.xxl,
    fontWeight: '800',
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.surface,
    borderRadius: Radii.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  locationTagText: {
    color: Colors.primaryRed,
    fontSize: Typography.fontSizes.xs,
    fontWeight: '600',
  },
  catScroll: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: 8,
  },
  catTab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: Radii.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderDim,
  },
  catTabActive: {
    backgroundColor: Colors.primaryRed,
    borderColor: Colors.primaryRed,
  },
  catText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizes.sm,
    fontWeight: '500',
  },
  catTextActive: {
    color: Colors.cream,
    fontWeight: '700',
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    color: Colors.textDim,
    fontSize: Typography.fontSizes.sm,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  separator: { height: Spacing.md },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    overflow: 'hidden',
  },
  cardImageWrap: {
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardImagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: Colors.charcoal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openTag: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 5,
  },
  openDot: { width: 6, height: 6, borderRadius: 3 },
  openText: { fontSize: Typography.fontSizes.xs, fontWeight: '700' },
  cardBody: { padding: Spacing.md },
  cardName: {
    color: Colors.text,
    fontSize: Typography.fontSizes.lg,
    fontWeight: '700',
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  ratingText: {
    color: Colors.text,
    fontSize: Typography.fontSizes.sm,
    fontWeight: '600',
  },
  reviewCount: {
    color: Colors.textDim,
    fontSize: Typography.fontSizes.xs,
  },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  distText: { color: Colors.textDim, fontSize: Typography.fontSizes.xs },
  priceText: {
    color: Colors.textDim,
    fontSize: Typography.fontSizes.xs,
    fontWeight: '600',
  },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: Spacing.xxxl },
  emptyTitle: { color: Colors.text, fontSize: Typography.fontSizes.lg, fontWeight: '600', marginTop: Spacing.md },
  emptySub: { color: Colors.textDim, fontSize: Typography.fontSizes.sm, textAlign: 'center', marginTop: Spacing.sm },
});
