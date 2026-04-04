import * as Device from 'expo-device';

// Rate limiting configuration
const MAX_POSTS_PER_DAY = 999; // Temporarily disabled for testing
const MAX_POSTS_PER_HOUR = 999; // Temporarily disabled for testing

export interface RateLimitCheck {
  allowed: boolean;
  message?: string;
  postsToday: number;
  postsThisHour: number;
}

async function checkRateLimit(): Promise<{
	allowed: boolean;
	message?: string;
}> {
	// Simple client-side rate limit: max 5 posts per day
	try {
		const key = "yardr_post_timestamps";
		const raw = await AsyncStorage.getItem(key);
		const timestamps: number[] = raw ? JSON.parse(raw) : [];

		const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
		const recent = timestamps.filter((t) => t > oneDayAgo);

		if (recent.length >= 5) {
			return {
				allowed: false,
				message: "You can only post 5 sales per day. Please try again later.",
			};
		}

		recent.push(Date.now());
		await AsyncStorage.setItem(key, JSON.stringify(recent));
		return { allowed: true };
	} catch {
		return { allowed: true };
	}
}

export const rateLimitService = {
	getDeviceId,
	checkRateLimit,
};

// Helper function to get unique device identifier
async function getDeviceId(): Promise<string> {
  try {
    // Try to get a unique device ID
    const deviceId = await Device.getDeviceIdAsync();

    if (deviceId) {
      return deviceId;
    }

    // Fallback: create a composite ID from available device info
    const deviceName = Device.deviceName || 'unknown';
    const modelName = Device.modelName || 'unknown';
    const osVersion = Device.osVersion || 'unknown';

    return `${deviceName}-${modelName}-${osVersion}`;
  } catch (error) {
    console.error('Error getting device ID:', error);
    // Ultimate fallback
    return 'unknown-device';
  }
}
