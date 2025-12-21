/**
 * Validation utility functions
 */

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (basic validation)
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  // Check if it has 10-15 digits (common phone number lengths)
  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
};

/**
 * Validate URL format
 */
export const isValidURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Check if a string is not empty or just whitespace
 */
export const isNotEmpty = (value: string): boolean => {
  return value.trim().length > 0;
};

/**
 * Validate minimum length
 */
export const hasMinLength = (value: string, minLength: number): boolean => {
  return value.length >= minLength;
};

/**
 * Validate maximum length
 */
export const hasMaxLength = (value: string, maxLength: number): boolean => {
  return value.length <= maxLength;
};

/**
 * Validate that a value is within a range
 */
export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

/**
 * Validate latitude
 */
export const isValidLatitude = (lat: number): boolean => {
  return isInRange(lat, -90, 90);
};

/**
 * Validate longitude
 */
export const isValidLongitude = (lon: number): boolean => {
  return isInRange(lon, -180, 180);
};

/**
 * Validate coordinates
 */
export const isValidCoordinates = (lat: number, lon: number): boolean => {
  return isValidLatitude(lat) && isValidLongitude(lon);
};
