import type { ScriptedCharSet } from "./types.js";

let scriptedCharSet: ScriptedCharSet;

/** Returns an object with subscript characters. */
export function getSubscriptCharSet(): ScriptedCharSet {
	return scriptedCharSet ??= {
		equals: "₌",
		minus: "₋",
		numbers: ["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉"],
		period: "\u2024",
		plus: "₊",
		parentheses: ["₍", "₎"],
		numberRegex: /^[₊₋]?[₀₁₂₃₄₅₆₇₈₉]+(\u2024[₀₁₂₃₄₅₆₇₈₉]+)?$/,
		type: "sub"
	};
}