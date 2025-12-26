import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";

const DEVICE_ID_KEY = "yardr_device_id_v1";

async function generateFallbackId() {
	// App-scoped ID (stable per install)
	if (Application.applicationId) {
		return `app:${Application.applicationId}:${Date.now()}`;
	}
	return `anon:${Math.random().toString(36).slice(2)}`;
}

async function getDeviceId(): Promise<string> {
	try {
		// 1. Try cache
		const cached = await AsyncStorage.getItem(DEVICE_ID_KEY);
		if (cached) return cached;

		// 2. Generate new ID
		const newId = await generateFallbackId();

		// 3. Persist
		await AsyncStorage.setItem(DEVICE_ID_KEY, newId);

		return newId;
	} catch (e) {
		console.warn("Device ID fallback used");
		return `temp:${Date.now()}`;
	}
}

export const rateLimitService = {
	getDeviceId,
};
