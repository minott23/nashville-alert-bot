// Nashville Metro alert service
// Pulls from Nashville Metro's publicly available feeds

const METRO_ALERTS_MOCK = [
  {
    id: 'a1',
    type: 'accident',
    title: 'Multi-vehicle accident',
    description: 'Multi-vehicle accident on I-40 eastbound near exit 209. Right lane blocked. Expect delays.',
    latitude: 36.1755,
    longitude: -86.7511,
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    severity: 'high',
  },
  {
    id: 'a2',
    type: 'road_closure',
    title: 'Road Closure',
    description: 'Broadway closed between 1st Ave and 5th Ave for special event. Detours in effect.',
    latitude: 36.1608,
    longitude: -86.7784,
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
    severity: 'medium',
  },
  {
    id: 'a3',
    type: 'police',
    title: 'Police Activity',
    description: 'Heavy police presence on Gallatin Ave near Five Points. Use alternate routes.',
    latitude: 36.1783,
    longitude: -86.7639,
    timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
    severity: 'medium',
  },
  {
    id: 'a4',
    type: 'alert',
    title: 'Flash Flood Watch',
    description: 'Flash Flood Watch in effect until 8 PM. Avoid low-lying areas near Cumberland River.',
    latitude: 36.1627,
    longitude: -86.7816,
    timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
    severity: 'high',
  },
  {
    id: 'a5',
    type: 'accident',
    title: 'Fender Bender',
    description: 'Minor accident on 440 westbound. Right shoulder. Emergency vehicles on scene.',
    latitude: 36.1490,
    longitude: -86.8012,
    timestamp: new Date(Date.now() - 22 * 60000).toISOString(),
    severity: 'low',
  },
  {
    id: 'a6',
    type: 'road_closure',
    title: 'Construction Zone',
    description: 'Downtown Nashville construction on 2nd Ave N. Lane reductions expected through Friday.',
    latitude: 36.1660,
    longitude: -86.7748,
    timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
    severity: 'low',
  },
  {
    id: 'a7',
    type: 'police',
    title: 'DUI Checkpoint',
    description: 'DUI checkpoint on Murfreesboro Pike near Antioch Pike. Have your documents ready.',
    latitude: 36.1050,
    longitude: -86.7200,
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
    severity: 'low',
  },
];

export const ALERT_TYPES = {
  accident: { label: 'Accident', color: '#EB1414', icon: 'car-crash' },
  road_closure: { label: 'Road Closure', color: '#F39C12', icon: 'block' },
  police: { label: 'Police', color: '#3498DB', icon: 'local-police' },
  alert: { label: 'Alert', color: '#9B59B6', icon: 'warning' },
};

export async function fetchNashvilleAlerts() {
  // In production, integrate with:
  // - Nashville 311 API: https://data.nashville.gov
  // - Metro Nashville Open Data Portal
  // - Waze for Cities API (if partnership established)
  // For now return realistic mock data
  return METRO_ALERTS_MOCK;
}
