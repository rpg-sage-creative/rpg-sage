import type { ScriptedCharSet } from "./ScriptedCharSet.js";

/**  Converts the given number to a string of scripted numbers using the given charSet. */
export function toScriptedNumber(value: number | bigint, charSet: ScriptedCharSet): string {
	return String(value)
		.split("")
		.map((char: string) => {
			switch(char) {
				case ".": return charSet.period;
				case "-": return charSet.minus;
				default: return charSet.numbers[+char];
			}
		})
		.join("");
}