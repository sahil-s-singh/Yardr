/**
 * Theme tokens used across the app.
 * Fresh palette: Terracotta primary with Sage, Indigo, Gold, Peach accents.
 */

const primary = "#DF6B4F";

export const Accent = {
	sage: "#6BAA8E",
	indigo: "#6366B5",
	gold: "#E3BF60",
	peach: "#F9AD85",
	primaryLight: "#F0A48E",
	error: "#E05244",
};

export const Colors = {
	light: {
		text: "#23201C",
		background: "#F7F6F4",
		tint: primary,
		icon: "#807A73",
		tabIconDefault: "#807A73",
		tabIconSelected: primary,

		card: "#FFFFFF",
		muted: "#F1EDE8",
		border: "#E8E5E1",
		secondaryText: "#807A73",

		shadow: "#000000",
	},

	dark: {
		text: "#ECEDEE",
		background: "#151718",
		tint: primary,
		icon: "#9BA1A6",
		tabIconDefault: "#9BA1A6",
		tabIconSelected: primary,

		card: "#1E1F22",
		muted: "#2A2B2E",
		border: "#2F3136",
		secondaryText: "#B5BCC2",

		shadow: "#000000",
	},
};
