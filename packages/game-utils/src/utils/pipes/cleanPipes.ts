import { globalizeRegex, PipedContentRegExp } from "@rsc-utils/core-utils";
import { unpipe } from "./unpipe.js";
import { regex } from "regex";

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
	return value;
}