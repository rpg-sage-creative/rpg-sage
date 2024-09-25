import { getSubscriptCharacters } from "./getSubscriptCharacters.js";

/** Converts the given number to a string of superscript numbers. Ex: 123 becomes "₁₂₃" */
export function toSubscript(value: number): string {
	const characters = getSubscriptCharacters();
	return String(value)
		.split("")
		.map(char => char === "." ? characters[11] : characters[+char])
		.join("");
}