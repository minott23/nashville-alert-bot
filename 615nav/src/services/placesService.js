// ─── REPLACE WITH YOUR GOOGLE PLACES API KEY ─────────────────────────────────
// Enable: Places API (New) in Google Cloud Console
const GOOGLE_PLACES_API_KEY = 'YOUR_GOOGLE_PLACES_API_KEY';
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = 'https://maps.googleapis.com/maps/api/place';

const CATEGORIES = [
  { id: 'restaurants', label: 'Restaurants', type: 'restaurant', icon: 'restaurant' },
  { id: 'bars', label: 'Bars', type: 'bar', icon: 'wine-bar' },
  { id: 'coffee', label: 'Coffee Shops', type: 'cafe', icon: 'local-cafe' },
  { id: 'things_to_do', label: 'Things to Do', type: 'tourist_attraction', icon: 'explore' },
];

export { CATEGORIES };

export async function fetchNearbyPlaces(latitude, longitude, type, radius = 2000) {
  const url = `${BASE_URL}/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&key=${GOOGLE_PLACES_API_KEY}`;
  try {
    const resp = await fetch(url);
    const data = await resp.json();
    if (data.status === 'OK') {
      return data.results.map(formatPlace);
    }
    // Fallback to mock data if API key not configured
    return getMockPlaces(type, latitude, longitude);
  } catch {
    return getMockPlaces(type, latitude, longitude);
  }
}

export async function fetchPlaceDetails(placeId) {
  const fields = 'name,formatted_address,formatted_phone_number,opening_hours,photos,rating,reviews,website,geometry';
  const url = `${BASE_URL}/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_PLACES_API_KEY}`;
  try {
    const resp = await fetch(url);
    const data = await resp.json();
    if (data.status === 'OK') return formatPlaceDetails(data.result);
    return null;
  } catch {
    return null;
  }
}

export function getPhotoUrl(photoReference, maxWidth = 400) {
  if (!photoReference) return null;
  return `${BASE_URL}/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;
}

function formatPlace(p) {
  return {
    id: p.place_id,
    name: p.name,
    rating: p.rating || 0,
    reviewCount: p.user_ratings_total || 0,
    isOpenNow: p.opening_hours?.open_now ?? null,
    address: p.vicinity,
    photoRef: p.photos?.[0]?.photo_reference || null,
    latitude: p.geometry.location.lat,
    longitude: p.geometry.location.lng,
    priceLevel: p.price_level || 0,
  };
}

function formatPlaceDetails(p) {
  return {
    id: p.place_id,
    name: p.name,
    address: p.formatted_address,
    phone: p.formatted_phone_number,
    website: p.website,
    rating: p.rating || 0,
    isOpen: p.opening_hours?.open_now ?? null,
    hours: p.opening_hours?.weekday_text || [],
    latitude: p.geometry?.location.lat,
    longitude: p.geometry?.location.lng,
    photos: (p.photos || []).map(ph => ph.photo_reference),
    reviews: p.reviews || [],
  };
}

function getMockPlaces(type, lat, lon) {
  const mockData = {
    restaurant: [
      { id: 'mock_r1', name: 'Hattie B\'s Hot Chicken', rating: 4.5, reviewCount: 8423, isOpenNow: true, address: '112 19th Ave S, Nashville', photoRef: null, latitude: lat + 0.003, longitude: lon + 0.002, priceLevel: 2 },
      { id: 'mock_r2', name: 'Prince\'s Hot Chicken', rating: 4.6, reviewCount: 5231, isOpenNow: true, address: '123 Ewing Dr, Nashville', photoRef: null, latitude: lat - 0.005, longitude: lon + 0.004, priceLevel: 1 },
      { id: 'mock_r3', name: 'The Southern', rating: 4.4, reviewCount: 3102, isOpenNow: false, address: '150 3rd Ave N, Nashville', photoRef: null, latitude: lat + 0.001, longitude: lon - 0.003, priceLevel: 3 },
      { id: 'mock_r4', name: 'Arnold\'s Country Kitchen', rating: 4.7, reviewCount: 4876, isOpenNow: true, address: '605 8th Ave S, Nashville', photoRef: null, latitude: lat - 0.002, longitude: lon + 0.001, priceLevel: 1 },
      { id: 'mock_r5', name: 'Loveless Cafe', rating: 4.5, reviewCount: 9201, isOpenNow: true, address: '8400 TN-100, Nashville', photoRef: null, latitude: lat + 0.006, longitude: lon - 0.007, priceLevel: 2 },
    ],
    bar: [
      { id: 'mock_b1', name: 'Broadway Honky Tonks', rating: 4.3, reviewCount: 12345, isOpenNow: true, address: 'Lower Broadway, Nashville', photoRef: null, latitude: lat + 0.002, longitude: lon - 0.001, priceLevel: 2 },
      { id: 'mock_b2', name: 'The Patterson House', rating: 4.6, reviewCount: 2341, isOpenNow: true, address: '1711 Division St, Nashville', photoRef: null, latitude: lat - 0.003, longitude: lon + 0.003, priceLevel: 3 },
      { id: 'mock_b3', name: 'Pinewood Social', rating: 4.4, reviewCount: 5678, isOpenNow: false, address: '33 Peabody St, Nashville', photoRef: null, latitude: lat + 0.004, longitude: lon + 0.002, priceLevel: 2 },
      { id: 'mock_b4', name: 'Santa\'s Pub', rating: 4.8, reviewCount: 3456, isOpenNow: true, address: '2225 Bransford Ave, Nashville', photoRef: null, latitude: lat - 0.001, longitude: lon - 0.004, priceLevel: 1 },
    ],
    cafe: [
      { id: 'mock_c1', name: 'Barista Parlor', rating: 4.6, reviewCount: 6723, isOpenNow: true, address: '519 Gallatin Ave, Nashville', photoRef: null, latitude: lat + 0.003, longitude: lon - 0.002, priceLevel: 2 },
      { id: 'mock_c2', name: 'Crema Coffee', rating: 4.5, reviewCount: 4321, isOpenNow: true, address: '15 Lea Ave, Nashville', photoRef: null, latitude: lat - 0.002, longitude: lon + 0.005, priceLevel: 2 },
      { id: 'mock_c3', name: 'Steadfast Coffee', rating: 4.4, reviewCount: 2198, isOpenNow: false, address: '2093 Fairfax Ave, Nashville', photoRef: null, latitude: lat + 0.001, longitude: lon + 0.003, priceLevel: 2 },
    ],
    tourist_attraction: [
      { id: 'mock_t1', name: 'Country Music Hall of Fame', rating: 4.7, reviewCount: 18234, isOpenNow: true, address: '222 Rep. John Lewis Way S', photoRef: null, latitude: lat + 0.002, longitude: lon - 0.003, priceLevel: 3 },
      { id: 'mock_t2', name: 'Ryman Auditorium', rating: 4.8, reviewCount: 14567, isOpenNow: true, address: '116 5th Ave N, Nashville', photoRef: null, latitude: lat - 0.001, longitude: lon + 0.001, priceLevel: 2 },
      { id: 'mock_t3', name: 'Centennial Park', rating: 4.7, reviewCount: 9876, isOpenNow: true, address: '2500 West End Ave, Nashville', photoRef: null, latitude: lat + 0.005, longitude: lon + 0.006, priceLevel: 0 },
      { id: 'mock_t4', name: 'Grand Ole Opry', rating: 4.7, reviewCount: 22341, isOpenNow: false, address: '2804 Opryland Dr, Nashville', photoRef: null, latitude: lat - 0.008, longitude: lon - 0.009, priceLevel: 3 },
    ],
  };
  return mockData[type] || [];
}
