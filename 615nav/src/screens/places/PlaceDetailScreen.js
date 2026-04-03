import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Linking,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii } from '../../theme/colors';
import { fetchPlaceDetails, getPhotoUrl } from '../../services/placesService';
import { useAuth } from '../../context/AuthContext';
import { getDistance } from '../../utils/time';
import { useApp } from '../../context/AppContext';

const { width: SCREEN_W } = Dimensions.get('window');

function StarRating({ rating, size = 14 }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1,2,3,4,5].map(s => (
        <Ionicons key={s} name={s <= Math.floor(rating) ? 'star' : s - 0.5 <= rating ? 'star-half' : 'star-outline'} size={size} color="#F1C40F" />
      ))}
    </View>
  );
}

export default function PlaceDetailScreen({ navigation, route }) {
  const { place: initialPlace, category } = route.params;
  const { user, profile, toggleVisitedPlace, toggleSavePost } = useAuth();
  const { location } = useApp();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visited, setVisited] = useState(profile?.visitedPlaces?.includes(initialPlace.id));
  const [saved, setSaved] = useState(profile?.savedPosts?.includes(initialPlace.id));
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    loadDetails();
  }, []);

  async function loadDetails() {
    setLoading(true);
    try {
      const d = await fetchPlaceDetails(initialPlace.id);
      if (d) setDetails(d);
    } catch {}
    setLoading(false);
  }

  async function handleVisited() {
    const newVal = !visited;
    setVisited(newVal);
    try {
      await toggleVisitedPlace(initialPlace.id);
    } catch {}
  }

  async function handleSave() {
    const newVal = !saved;
    setSaved(newVal);
    try {
      await toggleSavePost(initialPlace.id);
    } catch {}
  }

  function openDirections() {
    const lat = details?.latitude || initialPlace.latitude;
    const lon = details?.longitude || initialPlace.longitude;
    const name = encodeURIComponent(initialPlace.name);
    const url = Platform.OS === 'ios'
      ? `maps://?q=${name}&ll=${lat},${lon}`
      : `google.navigation:q=${lat},${lon}`;
    Linking.canOpenURL(url).then(can => {
      if (can) Linking.openURL(url);
      else Linking.openURL(`https://maps.google.com/maps?q=${lat},${lon}`);
    });
  }

  const photos = details?.photos || (initialPlace.photoRef ? [initialPlace.photoRef] : []);
  const hours = details?.hours || [];
  const dist = location
    ? getDistance(location.latitude, location.longitude, initialPlace.latitude, initialPlace.longitude)
    : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={22} color={Colors.text} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Photo header */}
        <View style={styles.photoWrap}>
          {photos.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={e => setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W))}
            >
              {photos.map((ref, i) => (
                <Image key={i} source={{ uri: getPhotoUrl(ref, 800) }} style={styles.photo} />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="business-outline" size={60} color={Colors.textDim} />
            </View>
          )}
          {photos.length > 1 && (
            <View style={styles.photoDots}>
              {photos.map((_, i) => (
                <View key={i} style={[styles.dot, i === photoIndex && styles.dotActive]} />
              ))}
            </View>
          )}
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={styles.infoHeaderLeft}>
              <Text style={styles.name}>{initialPlace.name}</Text>
              <View style={styles.ratingRow}>
                <StarRating rating={initialPlace.rating} />
                <Text style={styles.ratingNum}>{initialPlace.rating.toFixed(1)}</Text>
                <Text style={styles.ratingCount}>({initialPlace.reviewCount?.toLocaleString()})</Text>
              </View>
            </View>
            <View style={styles.infoHeaderRight}>
              {initialPlace.isOpenNow !== null && (
                <View style={[styles.openBadge, { backgroundColor: initialPlace.isOpenNow ? '#1a4a2a' : '#4a1a1a' }]}>
                  <View style={[styles.openDot, { backgroundColor: initialPlace.isOpenNow ? Colors.success : Colors.error }]} />
                  <Text style={[styles.openText, { color: initialPlace.isOpenNow ? Colors.success : Colors.error }]}>
                    {initialPlace.isOpenNow ? 'Open Now' : 'Closed'}
                  </Text>
                </View>
              )}
              {dist !== null && (
                <Text style={styles.distText}>{dist.toFixed(1)} mi away</Text>
              )}
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.dirBtn} onPress={openDirections}>
              <Ionicons name="navigate" size={18} color={Colors.cream} />
              <Text style={styles.dirBtnText}>Directions</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, visited && styles.actionBtnActive]} onPress={handleVisited}>
              <Ionicons name={visited ? 'checkmark-circle' : 'checkmark-circle-outline'} size={20} color={visited ? Colors.success : Colors.textSecondary} />
              <Text style={[styles.actionBtnText, visited && { color: Colors.success }]}>
                {visited ? 'Visited' : 'Mark Visited'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, saved && styles.actionBtnActive]} onPress={handleSave}>
              <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={20} color={saved ? Colors.primaryRed : Colors.textSecondary} />
              <Text style={[styles.actionBtnText, saved && { color: Colors.primaryRed }]}>
                {saved ? 'Saved' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Address & Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          {(details?.address || initialPlace.address) && (
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={16} color={Colors.primaryRed} style={styles.detailIcon} />
              <Text style={styles.detailText}>{details?.address || initialPlace.address}</Text>
            </View>
          )}
          {details?.phone && (
            <TouchableOpacity style={styles.detailRow} onPress={() => Linking.openURL(`tel:${details.phone}`)}>
              <Ionicons name="call-outline" size={16} color={Colors.primaryRed} style={styles.detailIcon} />
              <Text style={[styles.detailText, styles.link]}>{details.phone}</Text>
            </TouchableOpacity>
          )}
          {details?.website && (
            <TouchableOpacity style={styles.detailRow} onPress={() => Linking.openURL(details.website)}>
              <Ionicons name="globe-outline" size={16} color={Colors.primaryRed} style={styles.detailIcon} />
              <Text style={[styles.detailText, styles.link]} numberOfLines={1}>{details.website.replace(/^https?:\/\//, '')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Hours */}
        {hours.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hours</Text>
            {hours.map((h, i) => (
              <Text key={i} style={styles.hoursText}>{h}</Text>
            ))}
          </View>
        )}

        {/* Map */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.mapContainer}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              customMapStyle={darkMapStyle}
              initialRegion={{
                latitude: details?.latitude || initialPlace.latitude,
                longitude: details?.longitude || initialPlace.longitude,
                latitudeDelta: 0.008,
                longitudeDelta: 0.008,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              <Marker
                coordinate={{
                  latitude: details?.latitude || initialPlace.latitude,
                  longitude: details?.longitude || initialPlace.longitude,
                }}
              >
                <View style={styles.mapPin}>
                  <Ionicons name="location" size={24} color={Colors.primaryRed} />
                </View>
              </Marker>
            </MapView>
          </View>
        </View>

        {/* Reviews */}
        {details?.reviews?.length > 0 && (
          <View style={[styles.section, { paddingBottom: 30 }]}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            {details.reviews.slice(0, 3).map((r, i) => (
              <View key={i} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewAuthor}>{r.author_name}</Text>
                  <StarRating rating={r.rating} size={11} />
                </View>
                <Text style={styles.reviewText} numberOfLines={4}>{r.text}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={Colors.primaryRed} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  backBtn: {
    position: 'absolute',
    top: 56,
    left: Spacing.lg,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderDim,
  },
  content: { paddingBottom: 40 },
  photoWrap: { position: 'relative' },
  photo: { width: SCREEN_W, height: 260 },
  photoPlaceholder: {
    width: SCREEN_W,
    height: 260,
    backgroundColor: Colors.charcoal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoDots: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: Colors.white, width: 16 },
  infoCard: {
    backgroundColor: Colors.surface,
    margin: Spacing.lg,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    marginTop: -20,
  },
  infoHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
  infoHeaderLeft: { flex: 1, marginRight: Spacing.md },
  infoHeaderRight: { alignItems: 'flex-end', gap: 6 },
  name: {
    color: Colors.text,
    fontSize: Typography.fontSizes.xl,
    fontWeight: '800',
    marginBottom: 6,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  ratingNum: { color: Colors.text, fontSize: Typography.fontSizes.sm, fontWeight: '600' },
  ratingCount: { color: Colors.textDim, fontSize: Typography.fontSizes.xs },
  openBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  openDot: { width: 6, height: 6, borderRadius: 3 },
  openText: { fontSize: Typography.fontSizes.xs, fontWeight: '700' },
  distText: { color: Colors.textDim, fontSize: Typography.fontSizes.xs },
  actionRow: { flexDirection: 'row', gap: Spacing.sm },
  dirBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryRed,
    borderRadius: Radii.md,
    paddingVertical: 11,
    gap: 6,
  },
  dirBtnText: { color: Colors.cream, fontWeight: '700', fontSize: Typography.fontSizes.sm },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: Radii.md,
    paddingVertical: 11,
    gap: 5,
    borderWidth: 1,
    borderColor: Colors.borderDim,
  },
  actionBtnActive: { borderColor: Colors.primaryRed },
  actionBtnText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 11 },
  section: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: Typography.fontSizes.lg,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.sm },
  detailIcon: { marginRight: Spacing.sm, marginTop: 2 },
  detailText: { flex: 1, color: Colors.textSecondary, fontSize: Typography.fontSizes.sm, lineHeight: 20 },
  link: { color: Colors.primaryRed },
  hoursText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizes.sm,
    lineHeight: 22,
  },
  mapContainer: {
    height: 180,
    borderRadius: Radii.lg,
    overflow: 'hidden',
  },
  map: { flex: 1 },
  mapPin: { alignItems: 'center' },
  reviewCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  reviewAuthor: { color: Colors.text, fontSize: Typography.fontSizes.sm, fontWeight: '600' },
  reviewText: { color: Colors.textSecondary, fontSize: Typography.fontSizes.sm, lineHeight: 19 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#212121' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3c3c3c' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#181818' }] },
];
