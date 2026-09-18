/**
 * Escapes RegExp special characters in the given value.
 * This is a shim until RegExp.escape is available.
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/escape
 */
export function escapeRegex(value: string): string {
	return value.split("").map((char, index) => {
		if (!index
				&& "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".includes(char)
				|| ",-=<>#&!%:;@~'`\" ".includes(char)
				) {
			return `\\x${char.charCodeAt(0).toString(16)}`;
		}
		if ("^$\\.*+?()[]{}|/".includes(char)) {
			return `\\${char}`;
		}
		if (char === "\f") return "\\f";
		if (char === "\n") return "\\n";
		if (char === "\r") return "\\r";
		if (char === "\t") return "\\t";
		if (char === "\v") return "\\v";
		return char;
	}).join("");
}