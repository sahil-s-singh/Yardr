import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
	ActivityIndicator,
	ScrollView,
	StyleProp,
	StyleSheet,
	Text,
	TextInput,
	TextStyle,
	TouchableOpacity,
	View,
	ViewStyle,
} from "react-native";

type Coords = { latitude: number; longitude: number };

type Suggestion = {
	key: string;
	primary: string;
	secondary: string;
	address: string;
	coords: Coords;
	hasHouseNumber: boolean;
	source: "photon" | "nominatim";
};

type Props = {
	value: string;
	onChangeText: (text: string) => void;
	onSelect: (address: string, coords: Coords) => void;
	placeholder?: string;
	placeholderTextColor?: string;
	inputStyle?: StyleProp<TextStyle>;
	containerStyle?: StyleProp<ViewStyle>;
	minChars?: number;
	debounceMs?: number;
	limit?: number;
	/** Bias results near these coordinates (user's current location). */
	biasCoords?: Coords | null;
};

function formatPhotonFeature(feature: any): Suggestion | null {
	const coords = feature?.geometry?.coordinates;
	const props = feature?.properties;
	if (!coords || coords.length < 2 || !props) return null;

	const streetLine = [props.housenumber, props.street]
		.filter(Boolean)
		.join(" ");
	const cityLine = [props.city, props.state, props.country]
		.filter(Boolean)
		.join(", ");

	const primary = streetLine || props.name || cityLine || "Unknown";
	const secondary = streetLine ? cityLine : cityLine === primary ? "" : cityLine;
	const full = [primary, secondary].filter(Boolean).join(", ");
	const hasHouseNumber = Boolean(props.housenumber);

	return {
		key: `photon-${props.osm_type ?? ""}-${props.osm_id ?? ""}-${coords[0]}-${coords[1]}`,
		primary,
		secondary,
		address: full,
		coords: { latitude: coords[1], longitude: coords[0] },
		hasHouseNumber,
		source: "photon",
	};
}

function formatNominatimResult(result: any): Suggestion | null {
	if (!result?.lat || !result?.lon) return null;
	const lat = parseFloat(result.lat);
	const lon = parseFloat(result.lon);
	if (Number.isNaN(lat) || Number.isNaN(lon)) return null;

	const a = result.address ?? {};
	const houseNumber = a.house_number;
	const road = a.road || a.pedestrian || a.residential;
	const city = a.city || a.town || a.village || a.hamlet || a.county;
	const state = a.state;
	const country = a.country;

	const streetLine = [houseNumber, road].filter(Boolean).join(" ");
	const cityLine = [city, state, country].filter(Boolean).join(", ");
	const primary = streetLine || result.display_name?.split(",")[0] || "Unknown";
	const secondary = streetLine ? cityLine : "";
	const full = [primary, secondary].filter(Boolean).join(", ") || result.display_name;
	const hasHouseNumber = Boolean(houseNumber);

	return {
		key: `nominatim-${result.place_id ?? `${lat}-${lon}`}`,
		primary,
		secondary,
		address: full,
		coords: { latitude: lat, longitude: lon },
		hasHouseNumber,
		source: "nominatim",
	};
}

function dedupeAndRank(
	results: Suggestion[],
	queryHasNumber: boolean,
): Suggestion[] {
	const seen = new Map<string, Suggestion>();
	for (const s of results) {
		// Dedupe by ~11m precision so Photon and Nominatim variants of the
		// same place collapse into one, keeping the more specific one (with
		// house number) when available.
		const k = `${s.coords.latitude.toFixed(4)},${s.coords.longitude.toFixed(4)}`;
		const existing = seen.get(k);
		if (!existing) {
			seen.set(k, s);
			continue;
		}
		if (s.hasHouseNumber && !existing.hasHouseNumber) {
			seen.set(k, s);
		}
	}
	const list = Array.from(seen.values());
	// When the query looks like a specific address (starts with a number),
	// rank house-number matches above street/locality matches.
	if (queryHasNumber) {
		list.sort((a, b) => {
			if (a.hasHouseNumber !== b.hasHouseNumber) {
				return a.hasHouseNumber ? -1 : 1;
			}
			return 0;
		});
	}
	return list;
}

export default function AddressAutocomplete({
	value,
	onChangeText,
	onSelect,
	placeholder = "Enter your address",
	placeholderTextColor = "#807A73",
	inputStyle,
	containerStyle,
	minChars = 3,
	debounceMs = 350,
	limit = 7,
	biasCoords,
}: Props) {
	const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
	const [loading, setLoading] = useState(false);
	const [open, setOpen] = useState(false);
	const [suppressNextFetch, setSuppressNextFetch] = useState(false);

	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const abortRef = useRef<AbortController | null>(null);

	useEffect(() => {
		if (suppressNextFetch) {
			setSuppressNextFetch(false);
			return;
		}

		if (debounceRef.current) clearTimeout(debounceRef.current);
		if (abortRef.current) abortRef.current.abort();

		const query = value.trim();
		if (query.length < minChars) {
			setSuggestions([]);
			setLoading(false);
			return;
		}

		debounceRef.current = setTimeout(async () => {
			const controller = new AbortController();
			abortRef.current = controller;
			setLoading(true);
			const queryHasNumber = /\d/.test(query);
			try {
				const photonParams = new URLSearchParams({
					q: query,
					limit: String(limit),
					lang: "en",
				});
				if (biasCoords) {
					photonParams.set("lat", String(biasCoords.latitude));
					photonParams.set("lon", String(biasCoords.longitude));
					photonParams.set("location_bias_scale", "0.2");
					photonParams.set("zoom", "16");
				}
				const photonUrl = `https://photon.komoot.io/api/?${photonParams.toString()}`;

				const nominatimParams = new URLSearchParams({
					q: query,
					format: "jsonv2",
					addressdetails: "1",
					limit: String(limit),
				});
				if (biasCoords) {
					const { latitude, longitude } = biasCoords;
					const delta = 1.5; // ~150km viewbox around user
					nominatimParams.set(
						"viewbox",
						`${longitude - delta},${latitude + delta},${longitude + delta},${latitude - delta}`,
					);
					nominatimParams.set("bounded", "0");
				}
				const nominatimUrl = `https://nominatim.openstreetmap.org/search?${nominatimParams.toString()}`;

				const [photonRes, nominatimRes] = await Promise.allSettled([
					fetch(photonUrl, { signal: controller.signal }).then((r) => r.json()),
					fetch(nominatimUrl, {
						signal: controller.signal,
						headers: {
							"User-Agent": "Yardr/1.0 (garage-sale-app)",
							"Accept-Language": "en",
						},
					}).then((r) => r.json()),
				]);

				const combined: Suggestion[] = [];

				if (photonRes.status === "fulfilled") {
					const features: any[] = Array.isArray(photonRes.value?.features)
						? photonRes.value.features
						: [];
					for (const f of features) {
						const s = formatPhotonFeature(f);
						if (s) combined.push(s);
					}
				}

				if (nominatimRes.status === "fulfilled") {
					const results: any[] = Array.isArray(nominatimRes.value)
						? nominatimRes.value
						: [];
					for (const r of results) {
						const s = formatNominatimResult(r);
						if (s) combined.push(s);
					}
				}

				const ranked = dedupeAndRank(combined, queryHasNumber).slice(0, limit);
				setSuggestions(ranked);
				setOpen(ranked.length > 0);
			} catch (err: any) {
				if (err?.name !== "AbortError") {
					console.error("Address autocomplete error:", err);
					setSuggestions([]);
				}
			} finally {
				setLoading(false);
			}
		}, debounceMs);

		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [value, minChars, debounceMs, limit, biasCoords?.latitude, biasCoords?.longitude]);

	const handleSelect = (s: Suggestion) => {
		setSuppressNextFetch(true);
		onChangeText(s.address);
		onSelect(s.address, s.coords);
		setSuggestions([]);
		setOpen(false);
	};

	return (
		<View style={[styles.wrap, containerStyle]}>
			<View style={styles.inputRow}>
				<TextInput
					style={[styles.input, inputStyle]}
					value={value}
					onChangeText={(t) => {
						onChangeText(t);
						setOpen(true);
					}}
					placeholder={placeholder}
					placeholderTextColor={placeholderTextColor}
					autoCorrect={false}
					autoCapitalize="words"
					returnKeyType="search"
					onFocus={() => suggestions.length > 0 && setOpen(true)}
				/>
				{loading ? (
					<ActivityIndicator
						size="small"
						color="#DF6B4F"
						style={styles.loader}
					/>
				) : null}
			</View>

			{open && suggestions.length > 0 ? (
				<View style={styles.dropdown}>
					<ScrollView
						keyboardShouldPersistTaps="handled"
						nestedScrollEnabled
					>
						{suggestions.map((s, idx) => (
							<TouchableOpacity
								key={s.key}
								style={[
									styles.item,
									idx === suggestions.length - 1 && styles.itemLast,
								]}
								activeOpacity={0.7}
								onPress={() => handleSelect(s)}
							>
								<MaterialIcons
									name="place"
									size={18}
									color="#DF6B4F"
									style={styles.itemIcon}
								/>
								<View style={styles.itemTextWrap}>
									<Text style={styles.itemPrimary} numberOfLines={1}>
										{s.primary}
									</Text>
									{s.secondary ? (
										<Text style={styles.itemSecondary} numberOfLines={1}>
											{s.secondary}
										</Text>
									) : null}
								</View>
							</TouchableOpacity>
						))}
					</ScrollView>
				</View>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {
		position: "relative",
		zIndex: 10,
	},
	inputRow: {
		position: "relative",
	},
	input: {
		width: "100%",
	},
	loader: {
		position: "absolute",
		right: 14,
		top: 0,
		bottom: 0,
	},

	dropdown: {
		position: "absolute",
		top: "100%",
		left: 0,
		right: 0,
		marginTop: 6,
		backgroundColor: "#FFFFFF",
		borderRadius: 14,
		borderWidth: 1,
		borderColor: "rgba(0,0,0,0.08)",
		overflow: "hidden",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.12,
		shadowRadius: 20,
		elevation: 12,
		zIndex: 20,
		maxHeight: 280,
	},
	item: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 14,
		paddingVertical: 12,
		gap: 10,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: "rgba(0,0,0,0.06)",
	},
	itemLast: {
		borderBottomWidth: 0,
	},
	itemIcon: {
		marginTop: 1,
	},
	itemTextWrap: {
		flex: 1,
	},
	itemPrimary: {
		fontSize: 14,
		fontWeight: "700",
		color: "#23201C",
	},
	itemSecondary: {
		marginTop: 2,
		fontSize: 12,
		color: "#807A73",
	},
});
