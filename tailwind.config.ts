import type { Config } from "tailwindcss";

const config: Config = {
	darkMode: "class",
	content: [
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			colors: {
				canvas: "rgb(var(--color-canvas) / <alpha-value>)",
				surface: "rgb(var(--color-surface) / <alpha-value>)",
				"surface-muted": "rgb(var(--color-surface-muted) / <alpha-value>)",
				border: "rgb(var(--color-border) / <alpha-value>)",
				fg: "rgb(var(--color-fg) / <alpha-value>)",
				"fg-muted": "rgb(var(--color-fg-muted) / <alpha-value>)",
				"fg-subtle": "rgb(var(--color-fg-subtle) / <alpha-value>)",
				toucan: {
					50: "#f0fdfa",
					100: "#ccfbf1",
					200: "#99f6e4",
					300: "#5eead4",
					400: "#2dd4bf",
					500: "#14b8a6",
					600: "#0d9488",
					700: "#0f766e",
					800: "#115e59",
					900: "#134e4a",
					950: "#042f2e",
				},
			},
		},
	},
	plugins: [],
};
export default config;
