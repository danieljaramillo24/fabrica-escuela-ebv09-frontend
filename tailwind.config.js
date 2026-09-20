const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
	content: [
		"./index.html",
		"./src/**/*.{js,jsx,ts,tsx}",
	],
	theme: {
		extend: {
			// Tipografia del prototipo de Figma (Inter). Se carga en src/main.tsx
			fontFamily: {
				sans: ['"Inter Variable"', ...defaultTheme.fontFamily.sans],
			},
		},
	},
	plugins: [],
}
