import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "yardr:sellDraft:v1";

export type SellCoords = {
	latitude: number;
	longitude: number;
};

export type SellDraft = {
	// Step 1
	videoUri?: string;

	// Step 2 (Review)
	title?: string;
	description?: string;
	categories?: string[];
	photos?: string[];
	addressLine?: string;
	coords?: SellCoords;

	// Step 3 (Publish)
	contactName?: string;
	contactPhone?: string;
	contactEmail?: string;
	startDate?: string; // YYYY-MM-DD
	endDate?: string; // YYYY-MM-DD
	startTime?: string; // HH:mm (24h)
	endTime?: string; // HH:mm (24h)

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
