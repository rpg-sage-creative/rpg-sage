import type { Optional, TypedRegExp } from "@rsc-utils/type-utils";
// import { regex } from "regex";

type Results = {
	digits: string;
	hasAlpha: boolean;
};

type HexRegExpGroups = { digits:string; };

/*
const HexRegExp = regex("i")`
	^
	(0x|\#)
	(?<digits>
		(
			[0-9a-f]{3,4}  # rgb or rgba
		){1,2}             # rrggbb or rrggbbaa
	)
	$
` as TypedRegExp<HexRegExpGroups>;
*/

const HexRegExp = /^(?:0x|#)(?<digits>(?:[0-9a-f]{3,4}){1,2})$/iv as TypedRegExp<HexRegExpGroups>;

/**
 * @internal
 * Gets a RegExpMatchArray from the value that includes color and alpha.
 */
export function matchHex(value: Optional<string>): Results | undefined {
	if (!value) return undefined; // NOSONAR

	const match = HexRegExp.exec(value.trim());
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
