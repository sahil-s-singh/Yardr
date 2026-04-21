import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "yardr:sellDraft:v1";

export type SellDraft = {
	videoUri?: string;
	title?: string;
	description?: string;
	photos?: string[];
	addressLine?: string;
	categories?: string[];
	coords?: { latitude: number; longitude: number };
	updatedAt?: number;
};

export async function saveSellDraft(draft: SellDraft) {
	try {
		await AsyncStorage.setItem(
			KEY,
			JSON.stringify({ ...draft, updatedAt: Date.now() })
		);
	} catch {
		// ignore storage failures
	}
}

export async function loadSellDraft(): Promise<SellDraft | null> {
	try {
		const raw = await AsyncStorage.getItem(KEY);
		return raw ? (JSON.parse(raw) as SellDraft) : null;
	} catch {
		return null;
	}
}

export async function clearSellDraft() {
	try {
		await AsyncStorage.removeItem(KEY);
	} catch {
		// ignore
	}
}
