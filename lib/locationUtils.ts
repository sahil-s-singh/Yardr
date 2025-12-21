/**
 * Location utility functions for calculating distances and formatting
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Convert degrees to radians
 */
const toRad = (value: number): number => {
  return (value * Math.PI) / 180;
};

/**
 * Calculate distance between two points using Haversine formula
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  point1: Coordinates,
  point2: Coordinates
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(point2.latitude - point1.latitude);
  const dLon = toRad(point2.longitude - point1.longitude);
  const lat1 = toRad(point1.latitude);
  const lat2 = toRad(point2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Format distance for display
 * @param distanceKm Distance in kilometers
 * @returns Formatted string (e.g., "1.5 km", "500 m")
 */
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
};

/**
 * Convert kilometers to miles
 */
export const kmToMiles = (km: number): number => {
  return km * 0.621371;
};

/**
 * Convert miles to kilometers
 */
export const milesToKm = (miles: number): number => {
  return miles / 0.621371;
};
