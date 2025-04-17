import type { Optional } from "../../types/generics.js";

type Results = {
	digits: string;
	hasAlpha: boolean;
};

/**
 * @internal
 * Gets a RegExpMatchArray from the value that includes color and alpha.
 */
export function matchHex(value: Optional<string>): Results | undefined {
	if (!value) return undefined; // NOSONAR

	const regex = /^(0x|#)(?<digits>[0-9a-f]{3,8})$/i;
	const match = regex.exec(value.trim());
	const digits = match?.groups?.digits;
	if (!digits) return undefined; // NOSONAR

	const digitCount = digits.length;
	const noAlpha = digitCount === 3 || digitCount === 6;
	const hasAlpha = digitCount === 4 || digitCount === 8;
	if (noAlpha || hasAlpha) {
		return { digits, hasAlpha };
	}

	return undefined;
}
