import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@yardr:notificationHistory";
const MAX_ENTRIES = 100;

export type NotificationHistoryEntry = {
	id: string;
	title: string;
	body: string;
	data?: Record<string, any>;
	receivedAt: string;
	read: boolean;
};

async function readAll(): Promise<NotificationHistoryEntry[]> {
	try {
		const raw = await AsyncStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

async function writeAll(entries: NotificationHistoryEntry[]): Promise<void> {
	await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export const notificationHistory = {
	async list(): Promise<NotificationHistoryEntry[]> {
		return readAll();
	},

	async append(
		entry: Omit<NotificationHistoryEntry, "id" | "receivedAt" | "read"> & {
			id?: string;
			receivedAt?: string;
			read?: boolean;
		},
	): Promise<void> {
		const existing = await readAll();
		const id =
			entry.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
		const next: NotificationHistoryEntry = {
			id,
			title: entry.title,
			body: entry.body,
			data: entry.data,
			receivedAt: entry.receivedAt ?? new Date().toISOString(),
			read: entry.read ?? false,
		};
		const merged = [next, ...existing].slice(0, MAX_ENTRIES);
		await writeAll(merged);
	},

	async markAsRead(id: string): Promise<void> {
		const all = await readAll();
		const next = all.map((n) => (n.id === id ? { ...n, read: true } : n));
		await writeAll(next);
	},

	async markAllRead(): Promise<void> {
		const all = await readAll();
		await writeAll(all.map((n) => ({ ...n, read: true })));
	},

	async remove(id: string): Promise<void> {
		const all = await readAll();
		await writeAll(all.filter((n) => n.id !== id));
	},

	async clear(): Promise<void> {
		await AsyncStorage.removeItem(STORAGE_KEY);
	},

	async unreadCount(): Promise<number> {
		const all = await readAll();
		return all.filter((n) => !n.read).length;
	},
};
