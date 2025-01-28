export function getMacroArgRegex(type: "indexed" | "named" | "remaining"): RegExp {
	switch(type) {
		case "indexed": return /\{(\d+)(?::(?!:)[^}]+)?\}/g;
		case "named": return /\{(\w+)(?::(?!:)[^}]+)?\}/g;
		case "remaining": return /\{(?:\.{3}|…)\}/g;
	}
}