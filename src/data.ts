import type { Resource, Incident, Alert, ResourceType } from './types';

export const resourceTypeLabel: Record<ResourceType, string> = {
  hospital: 'Hospital',
  blood_bank: 'Blood Bank',
  ambulance: 'Ambulance',
  shelter: 'Shelter',
  rescue: 'Rescue Team',
  incident: 'Incident',
};

export const resources: Resource[] = [
  {
    id: 'r1',
    type: 'hospital',
    name: 'Kathmandu Model Hospital',
    status: 'available',
    distanceKm: 2.1,
    etaMin: 7,
    x: 35,
    y: 30,
    lat: 27.7126,
    lng: 85.3158,
    details: ['ICU: 3 beds available', 'Emergency: OPEN', 'Trauma unit ready'],
    capacity: '12 ICU beds',
    phone: '+977-1-4107000',
  },
  {
    id: 'r2',
    type: 'blood_bank',
    name: 'Nepal Red Cross Blood Bank',
    status: 'critical',
    distanceKm: 2.4,
    etaMin: 8,
    x: 62,
    y: 45,
    lat: 27.7006,
    lng: 85.3137,
    details: ['O-: LOW (2 units)', 'A+: Available', 'B+: Available'],
    phone: '+977-1-4228094',
  },
  {
    id: 'r3',
    type: 'ambulance',
    name: 'Ambulance Unit-07',
    status: 'responding',
    distanceKm: 1.2,
    etaMin: 4,
    x: 48,
    y: 52,
    lat: 27.7085,
    lng: 85.3206,
    details: ['ALS equipped', '2 paramedics onboard'],
    phone: '+977-9801100000',
  },
  {
    id: 'r4',
    type: 'shelter',
    name: 'Tribhuvan University Shelter',
    status: 'available',
    distanceKm: 3.5,
    etaMin: 12,
    x: 70,
    y: 65,
    lat: 27.678,
    lng: 85.2863,
    details: ['Capacity: 500 people', 'Current: 180 people', 'Food & water available'],
    capacity: '500 people',
  },
  {
    id: 'r5',
    type: 'rescue',
    name: 'Nepal Army Rescue Team Alpha',
    status: 'in_transit',
    distanceKm: 5.0,
    etaMin: 15,
    x: 25,
    y: 60,
    lat: 27.6962,
    lng: 85.3143,
    details: ['12 personnel', 'Boat rescue equipped', 'Medical support'],
  },
  {
    id: 'r6',
    type: 'hospital',
    name: 'Bir Hospital Emergency',
    status: 'responding',
    distanceKm: 4.2,
    etaMin: 14,
    x: 55,
    y: 22,
    lat: 27.7047,
    lng: 85.3086,
    details: ['ICU: 1 bed available', 'Emergency: BUSY', 'Surgery in progress'],
    capacity: '8 ICU beds',
    phone: '+977-1-4221119',
  },
  {
    id: 'r7',
    type: 'ambulance',
    name: 'Ambulance Unit-03',
    status: 'available',
    distanceKm: 3.0,
    etaMin: 10,
    x: 80,
    y: 35,
    lat: 27.6948,
    lng: 85.3326,
    details: ['BLS equipped', '1 paramedic onboard'],
    phone: '+977-9801200000',
  },
  {
    id: 'r8',
    type: 'shelter',
    name: 'Kirtipur Community Center',
    status: 'available',
    distanceKm: 6.0,
    etaMin: 20,
    x: 15,
    y: 40,
    lat: 27.6732,
    lng: 85.2802,
    details: ['Capacity: 200 people', 'Current: 45 people', 'Supplies available'],
    capacity: '200 people',
  },
];

export const incidents: Incident[] = [
  {
    id: 'i1',
    type: 'flood',
    severity: 'critical',
    title: 'Severe Flooding — Bagmati River',
    description: 'River overflow causing major flooding in residential areas near Kalanki. Multiple homes submerged.',
    location: 'Kalanki, Kathmandu',
    peopleAffected: 4200,
    status: 'active',
    reportedAt: '12 min ago',
    x: 45,
    y: 50,
    lat: 27.6998,
    lng: 85.2881,
  },
  {
    id: 'i2',
    type: 'medical',
    severity: 'high',
    title: 'Emergency Medical — Trauma Victim',
    description: 'Road accident victim needs immediate medical evacuation. Severe leg injury, conscious.',
    location: 'Ratna Park, Kathmandu',
    peopleAffected: 1,
    status: 'responding',
    reportedAt: '5 min ago',
    x: 58,
    y: 38,
    lat: 27.7041,
    lng: 85.311,
  },
  {
    id: 'i3',
    type: 'flood',
    severity: 'high',
    title: 'Flood Warning — Bishnumati Corridor',
    description: 'Rising water levels reported. Evacuation recommended for low-lying areas.',
    location: 'Bishnumati, Kathmandu',
    peopleAffected: 1150,
    status: 'active',
    reportedAt: '25 min ago',
    x: 30,
    y: 70,
    lat: 27.7124,
    lng: 85.2951,
  },
  {
    id: 'i4',
    type: 'accident',
    severity: 'moderate',
    title: 'Vehicle Accident — Ring Road',
    description: 'Two-vehicle collision on Ring Road. Minor injuries reported, traffic blocked.',
    location: 'Ring Road, Balaju',
    peopleAffected: 4,
    status: 'responding',
    reportedAt: '18 min ago',
    x: 72,
    y: 28,
    lat: 27.7331,
    lng: 85.3043,
  },
  {
    id: 'i5',
    type: 'landslide',
    severity: 'high',
    title: 'Landslide — Arniko Highway',
    description: 'Slope failure blocked two lanes of the highway. Traffic diverted, no casualties reported.',
    location: 'Arniko Highway, Sanga',
    peopleAffected: 320,
    status: 'resolved',
    reportedAt: '2 days ago',
    x: 86,
    y: 74,
    lat: 27.6603,
    lng: 85.4612,
  },
  {
    id: 'i6',
    type: 'fire',
    severity: 'moderate',
    title: 'Warehouse Fire — Kalimati',
    description: 'Storage warehouse fire contained by Kathmandu Fire Brigade. No injuries reported.',
    location: 'Kalimati, Kathmandu',
    peopleAffected: 60,
    status: 'resolved',
    reportedAt: '3 days ago',
    x: 38,
    y: 44,
    lat: 27.7031,
    lng: 85.2944,
  },
  {
    id: 'i7',
    type: 'flood',
    severity: 'moderate',
    title: 'Street Flooding — Maharajgunj',
    description: 'Drainage overflow flooded low sections of the road. Water receded after 4 hours.',
    location: 'Maharajgunj, Kathmandu',
    peopleAffected: 240,
    status: 'resolved',
    reportedAt: '5 days ago',
    x: 64,
    y: 16,
    lat: 27.7437,
    lng: 85.3261,
  },
];

const PLACES: Record<string, { lat: number; lng: number }> = {
  kalanki: { lat: 27.6998, lng: 85.2881 },
  kalimati: { lat: 27.7031, lng: 85.2944 },
  balaju: { lat: 27.7331, lng: 85.3043 },
  bishnumati: { lat: 27.7124, lng: 85.2951 },
  'ratna park': { lat: 27.7041, lng: 85.311 },
  ratnapark: { lat: 27.7041, lng: 85.311 },
  'ring road': { lat: 27.726, lng: 85.323 },
  maharajgunj: { lat: 27.7437, lng: 85.3261 },
  thamel: { lat: 27.715, lng: 85.312 },
  baneshwor: { lat: 27.692, lng: 85.335 },
  'new baneshwor': { lat: 27.692, lng: 85.335 },
  koteshwor: { lat: 27.685, lng: 85.352 },
  tripureshwor: { lat: 27.695, lng: 85.315 },
  chabahil: { lat: 27.709, lng: 85.348 },
  sankhamul: { lat: 27.693, lng: 85.306 },
  gongabu: { lat: 27.733, lng: 85.31 },
  patan: { lat: 27.671, lng: 85.325 },
  lalitpur: { lat: 27.671, lng: 85.325 },
  bhaktapur: { lat: 27.671, lng: 85.4298 },
  kirtipur: { lat: 27.6732, lng: 85.2802 },
  bouddha: { lat: 27.721, lng: 85.362 },
  boudha: { lat: 27.721, lng: 85.362 },
  pashupatinath: { lat: 27.71, lng: 85.349 },
  swayambhu: { lat: 27.715, lng: 85.29 },
  'arniko highway': { lat: 27.683, lng: 85.355 },
  sanga: { lat: 27.6603, lng: 85.4612 },
  kathmandu: { lat: 27.7172, lng: 85.324 },
  dharan: { lat: 26.81, lng: 87.28 },
  pokhara: { lat: 28.2096, lng: 83.9856 },
};

export function lookupPlace(name: string): { lat: number; lng: number } | undefined {
  const haystack = name.trim().toLowerCase();
  if (!haystack) return undefined;
  let best: { lat: number; lng: number } | undefined;
  let bestLen = 0;
  for (const [key, coords] of Object.entries(PLACES)) {
    if (haystack.includes(key) && key.length > bestLen) {
      best = coords;
      bestLen = key.length;
    }
  }
  return best;
}

// great-circle distance between two points, in km
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

// reverse of lookupPlace: the closest named area to a GPS fix, if any is
// within 5 km (otherwise the name would be misleading)
export function nearestPlace(lat: number, lng: number): string | null {
  let best: string | null = null;
  let bestKm = 5;
  for (const [key, coords] of Object.entries(PLACES)) {
    const km = distanceKm({ lat, lng }, coords);
    if (km < bestKm) {
      best = key;
      bestKm = km;
    }
  }
  return best ? best.replace(/\b\w/g, (c) => c.toUpperCase()) : null;
}

export const openIncidents = incidents.filter((i) => i.status !== 'resolved');
export const resolvedIncidents = incidents.filter((i) => i.status === 'resolved');

export const peopleAffectedNow = openIncidents.reduce((s, i) => s + i.peopleAffected, 0);
export const peopleAffectedTotal = incidents.reduce((s, i) => s + i.peopleAffected, 0);

export const alerts: Alert[] = [
  {
    id: 'a1',
    type: 'flood',
    severity: 'critical',
    title: 'FLOOD ALERT — Bagmati River Overflow',
    message: 'Severe flooding in Kalanki area. Immediate evacuation advised for riverside communities. Water level rising rapidly.',
    area: 'Kalanki, Kalimati, Balaju',
    time: '2 min ago',
    active: true,
  },
  {
    id: 'a2',
    type: 'flood',
    severity: 'high',
    title: 'Flood Watch — Bishnumati River',
    message: 'Water levels approaching warning threshold. Residents in low-lying areas should prepare for possible evacuation.',
    area: 'Bishnumati corridor',
    time: '20 min ago',
    active: true,
  },
  {
    id: 'a3',
    type: 'flood',
    severity: 'moderate',
    title: 'Weather Advisory — Heavy Rainfall Expected',
    message: 'Monsoon rainfall intensifying over the next 24 hours. Risk of flash floods in valley areas.',
    area: 'Kathmandu Valley',
    time: '1 hour ago',
    active: true,
  },
];
