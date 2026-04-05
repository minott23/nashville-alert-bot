import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii } from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import { fetchNashvilleAlerts, ALERT_TYPES } from '../../services/alertService';
import { formatTimeAgo } from '../../utils/time';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const NASHVILLE = {
  latitude: 36.1627,
  longitude: -86.7816,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

const PIN_COLORS = {
  accident: '#EB1414',
  road_closure: '#F39C12',
  police: '#3498DB',
  alert: '#9B59B6',
};

const TYPE_ICONS = {
  accident: 'car',
  road_closure: 'alert-circle',
  police: 'shield',
  alert: 'warning',
};

export default function MapScreen() {
  const { location } = useApp();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  const mapRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  async function loadAlerts() {
    try {
      const data = await fetchNashvilleAlerts();
      setAlerts(data);
    } catch {}
    setLoading(false);
  }

  function selectAlert(alert) {
    setSelected(alert);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }

  function closeDetail() {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setSelected(null));
  }

  function centerOnMe() {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 800);
    }
  }

  const filteredAlerts = filter === 'all' ? alerts : alerts.filter(a => a.type === filter);

  const filters = [
    { id: 'all', label: 'All', icon: 'layers-outline' },
    { id: 'accident', label: 'Accidents', icon: 'car-outline' },
    { id: 'road_closure', label: 'Closures', icon: 'alert-circle-outline' },
    { id: 'police', label: 'Police', icon: 'shield-outline' },
    { id: 'alert', label: 'Alerts', icon: 'warning-outline' },
  ];

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={NASHVILLE}
        customMapStyle={darkMapStyle}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
      >
        {filteredAlerts.map(alert => (
          <Marker
            key={alert.id}
            coordinate={{ latitude: alert.latitude, longitude: alert.longitude }}
            onPress={() => selectAlert(alert)}
          >
            <View style={[styles.pin, { backgroundColor: PIN_COLORS[alert.type] }]}>
              <Ionicons name={TYPE_ICONS[alert.type]} size={14} color="#fff" />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Header overlay */}
      <SafeAreaView style={styles.headerOverlay} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>615</Text>
            </View>
            <Text style={styles.headerTitle}>Live Map</Text>
          </View>
          <View style={styles.alertBadge}>
            <Ionicons name="radio" size={12} color={Colors.primaryRed} />
            <Text style={styles.alertBadgeText}>{alerts.length} active</Text>
          </View>
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {filters.map(f => (
            <TouchableOpacity
              key={f.id}
              style={[styles.chip, filter === f.id && styles.chipActive]}
              onPress={() => setFilter(f.id)}
            >
              <Ionicons
                name={f.icon}
                size={13}
                color={filter === f.id ? Colors.cream : Colors.textSecondary}
              />
              <Text style={[styles.chipText, filter === f.id && styles.chipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      {/* My location button */}
      <TouchableOpacity style={styles.locBtn} onPress={centerOnMe}>
        <Ionicons name="locate" size={20} color={Colors.text} />
      </TouchableOpacity>

      {/* Loading */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={Colors.primaryRed} />
        </View>
      )}

      {/* Alert detail slide-up */}
      {selected && (
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={closeDetail}>
          <Animated.View
            style={[styles.detailCard, { transform: [{ translateY: slideAnim }] }]}
          >
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              <View style={styles.detailHandle} />
              <View style={styles.detailHeader}>
                <View style={[styles.typeTag, { backgroundColor: PIN_COLORS[selected.type] + '25' }]}>
                  <Ionicons name={TYPE_ICONS[selected.type]} size={14} color={PIN_COLORS[selected.type]} />
                  <Text style={[styles.typeTagText, { color: PIN_COLORS[selected.type] }]}>
                    {ALERT_TYPES[selected.type]?.label || selected.type}
                  </Text>
                </View>
                <Text style={styles.detailTime}>{formatTimeAgo(selected.timestamp)}</Text>
              </View>
              <Text style={styles.detailTitle}>{selected.title}</Text>
              <Text style={styles.detailDesc}>{selected.description}</Text>
              <View style={styles.detailActions}>
                <TouchableOpacity
                  style={styles.detailBtn}
                  onPress={() => {
                    mapRef.current?.animateToRegion({
                      latitude: selected.latitude,
                      longitude: selected.longitude,
                      latitudeDelta: 0.02,
                      longitudeDelta: 0.02,
                    }, 600);
                    closeDetail();
                  }}
                >
                  <Ionicons name="navigate" size={16} color={Colors.cream} />
                  <Text style={styles.detailBtnText}>View on Map</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.detailBtnSecondary} onPress={closeDetail}>
                  <Text style={styles.detailBtnSecondaryText}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  map: { ...StyleSheet.absoluteFillObject },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    backgroundColor: Colors.overlay,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderDim,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoBadge: {
    backgroundColor: Colors.primaryRed,
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  logoText: { color: Colors.cream, fontSize: 12, fontWeight: '800' },
  headerTitle: { color: Colors.text, fontSize: Typography.fontSizes.md, fontWeight: '700' },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceLight,
    borderRadius: Radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  alertBadgeText: { color: Colors.primaryRed, fontSize: Typography.fontSizes.xs, fontWeight: '600' },
  filters: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.overlay,
    borderRadius: Radii.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 5,
    borderWidth: 1,
    borderColor: Colors.borderDim,
  },
  chipActive: {
    backgroundColor: Colors.primaryRed,
    borderColor: Colors.primaryRed,
  },
  chipText: { color: Colors.textSecondary, fontSize: Typography.fontSizes.xs, fontWeight: '500' },
  chipTextActive: { color: Colors.cream },
  pin: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
  locBtn: {
    position: 'absolute',
    bottom: 120,
    right: Spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderDim,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.overlayLight,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  detailCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.xl,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: Colors.borderDim,
  },
  detailHandle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.borderDim,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  typeTagText: { fontSize: Typography.fontSizes.xs, fontWeight: '700' },
  detailTime: { color: Colors.textDim, fontSize: Typography.fontSizes.xs },
  detailTitle: {
    color: Colors.text,
    fontSize: Typography.fontSizes.xl,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  detailDesc: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizes.md,
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  detailActions: { flexDirection: 'row', gap: Spacing.md },
  detailBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryRed,
    borderRadius: Radii.md,
    paddingVertical: 13,
    gap: 6,
  },
  detailBtnText: { color: Colors.cream, fontWeight: '700', fontSize: Typography.fontSizes.sm },
  detailBtnSecondary: {
    paddingVertical: 13,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: Radii.md,
  },
  detailBtnSecondaryText: { color: Colors.textSecondary, fontWeight: '600', fontSize: Typography.fontSizes.sm },
});

// Dark map style compatible with the app's color scheme
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#212121' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#757575' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#181818' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'poi.park', elementType: 'labels.text.stroke', stylers: [{ color: '#1b1b1b' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#373737' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3c3c3c' }] },
  { featureType: 'road.highway.controlled_access', elementType: 'geometry', stylers: [{ color: '#4e4e4e' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d3d3d' }] },
];
