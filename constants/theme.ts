/**
 * Theme tokens used across the app.
 * Keeps compatibility with the existing Expo template structure (Colors.light / Colors.dark).
 */

const orange = "#D97B3F";

export const Colors = {
	light: {
		text: "#1F1F1F",
		background: "#FAF7F2",
		tint: orange,
		icon: "#6F6A64",
		tabIconDefault: "#9A928A",
		tabIconSelected: orange,

		card: "#FFFFFF",
		muted: "#F1EDE6",
		border: "#E6E1DA",
		secondaryText: "#6F6A64",

		shadow: "#000000",
	},

	dark: {
		text: "#ECEDEE",
		background: "#151718",
		tint: orange,
		icon: "#9BA1A6",
		tabIconDefault: "#9BA1A6",
		tabIconSelected: orange,

		card: "#1E1F22",
		muted: "#2A2B2E",
		border: "#2F3136",
		secondaryText: "#B5BCC2",

		shadow: "#000000",
	},
};
