import { globalizeRegex, PipedContentRegExp } from "@rsc-utils/core-utils";
import { regex } from "regex";
import { trimWithPadding } from "../trimWithPadding.js";
import { unpipe } from "./unpipe.js";

const NestedPipeRegExp = regex`
	\|{2}
		.*?
		${PipedContentRegExp}
		.*?
	\|{2}
`;
const NestedPipeRegExpG = globalizeRegex(NestedPipeRegExp);

/** Cleans instances of nested pipes by removing inner pipes. */
export function cleanPipes(value: string): string {
	const { startPad, trimmed, endPad } = trimWithPadding(value);
	value = trimmed;
	while (NestedPipeRegExp.test(value)) {
		value = value.replace(NestedPipeRegExpG, outer => {
			// remove the outer pipes
			const inner = outer.slice(2, -2);
			// remove all inner pipes
			const { unpiped } = unpipe(inner);
			// put other pipes back
			return "||" + unpiped + "||";
		});
	}
	return startPad + value + endPad;
}