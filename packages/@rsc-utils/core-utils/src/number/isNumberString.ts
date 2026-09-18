import type { Optional } from "@rsc-utils/type-utils";

/** /[\-\+]?\d+(?:\.\d+)?/ */
export const NumberRegExp = /[\-\+]?\d+(?:\.\d+)?/;

type NumberString = `${"-"|"+"|""}${number}`;

export function isNumberString(value: Optional<string>): value is NumberString {
	if (!value) return false;
	const match = NumberRegExp.exec(value);
	return match?.index === 0 && match[0].length === value.length;
}