import type { ScriptedCharSet } from "../../characters/types.js";

/** @internal Converts the given number to a string of scripted numbers. */
export function toScriptedNumber(value: number | bigint, characters: ScriptedCharSet): string {
	const mapper = (char: string) => {
		switch(char) {
			case ".": return characters.period;
			case "-": return characters.minus;
			default: return characters.numbers[+char];
		}
	};
	return String(value).split("").map(mapper).join("");
}