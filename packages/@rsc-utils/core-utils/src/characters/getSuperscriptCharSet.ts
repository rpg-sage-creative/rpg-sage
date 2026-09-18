import type { ScriptedCharSet } from "./types.js";

let superscriptCharSet: ScriptedCharSet;

/** Returns an object with superscript characters. */
export function getSuperscriptCharSet(): ScriptedCharSet {
	return superscriptCharSet ??= {
		equals: "⁼",
		minus: "⁻",
		numbers: ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"],
		period: "\u22C5",
		plus: "⁺",
		parentheses: ["⁽", "⁾"],
		numberRegex: /^[⁺⁻]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+(\u22C5[⁰¹²³⁴⁵⁶⁷⁸⁹]+)?$/,
		type: "super"
	};
}