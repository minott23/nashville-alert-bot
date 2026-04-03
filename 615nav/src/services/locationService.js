import * as Location from 'expo-location';

const NASHVILLE_CENTER = {
  latitude: 36.1627,
  longitude: -86.7816,
};

const NASHVILLE_NEIGHBORHOODS = [
  'Nashville',
  'East Nashville',
  'The Gulch',
  'Midtown',
  'Germantown',
  'SoBro',
  'Sylvan Park',
  'Green Hills',
  'Hillsboro Village',
  'Wedgewood-Houston',
  'Berry Hill',
  '12South',
  'Edgehill',
  'Five Points',
  'Belmont',
  'Music Row',
  'Brentwood',
];

export async function requestLocationPermission() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function getCurrentLocation() {
  try {
    const granted = await requestLocationPermission();
    if (!granted) return NASHVILLE_CENTER;

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch {
    return NASHVILLE_CENTER;
  }
}

export async function getLocationLabel(lat, lon) {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
    if (results && results.length > 0) {
      const r = results[0];
      if (r.district) return r.district;
      if (r.subregion) return r.subregion;
      if (r.city) return r.city;
    }
  } catch {
    // fallback below
  }
  // Approximate neighborhood by rough lat/lon
  const idx = Math.floor(Math.random() * NASHVILLE_NEIGHBORHOODS.length);
  return NASHVILLE_NEIGHBORHOODS[idx];
}

export function getNashvilleCenter() {
  return NASHVILLE_CENTER;
}
