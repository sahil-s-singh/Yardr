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

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
