/** Haversine distance in miles between two lat/lng points. */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Get distance from home to a college, or null if coordinates unavailable. */
export function distanceFromHome(
  homeLat: number | null,
  homeLon: number | null,
  collegeLat: number | null,
  collegeLon: number | null
): number | null {
  if (homeLat == null || homeLon == null || collegeLat == null || collegeLon == null) {
    return null;
  }
  return haversineDistance(homeLat, homeLon, collegeLat, collegeLon);
}
