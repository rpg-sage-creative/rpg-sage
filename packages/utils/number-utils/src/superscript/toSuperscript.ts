import { getSuperscriptCharacters } from "./getSuperscriptCharacters.js";

/** Converts the given number to a string of superscript numbers. Ex: 123 becomes "¹²³" */
export function toSuperscript(value: number | bigint): string {
	const characters = getSuperscriptCharacters();
	return String(value)
		.split("")
		.map(char => char === "." ? characters[11] : characters[+char])
		.join("");
}