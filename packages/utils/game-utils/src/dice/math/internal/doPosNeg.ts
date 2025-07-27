import { getOrCreateRegex, type RegExpGetOptions, type RegExpSpoilerOptions } from "@rsc-utils/core-utils";
import { regex } from "regex";
import { unpipe } from "../../internal/pipes.js";
import { evalMath } from "./evalMath.js";

type CreateOptions = RegExpGetOptions & RegExpSpoilerOptions;

type GetOptions = RegExpGetOptions & RegExpSpoilerOptions;

/** Creates a new instance of the positive / negative number regex based on options. */
function createPosNegRegex(options?: CreateOptions): RegExp {
	const { gFlag = "", iFlag = "" } = options ?? {};

	// build our own instead of calling getNumberRegex() to exclude the optional sign capture
	return regex(gFlag + iFlag)`
		(
			([\-+]\s*){2,}  # multiple pos/neg signs
			\d+(\.\d+)?     # decimal number
		)
	`;
}

/**
 * Tests the value against a pos / neg number regex using the given options.
 */
export function getPosNegRegex(options?: GetOptions): RegExp {
	return getOrCreateRegex(createPosNegRegex, options);
}

/**
 * Properly converts strings of pos / neg signs to the final (correct) sign.
 * Any eval() resulting in null, undefined, or NaN will have "(NaN)" instead of a numeric result.
 * Any eval() that throws an error will have "(ERR)" instead of a numeric result.
 */
export function doPosNeg(input: string, options?: GetOptions): string {
	// const logQueue = new LogQueue("doPosNeg", input);
	let output = input;

	// get a cached instance of the regexp for testing
	const tester = getPosNegRegex(options);

	// iterate while we have matches
	while (tester.test(output)) {
		// create a new regex to ensure we have our own lastIndex
		const replacer = createPosNegRegex({ gFlag:"g", iFlag:options?.iFlag, spoilers:options?.spoilers });

		// replace all matches
		output = output.replace(replacer, value => {
			const { hasPipes, unpiped } = unpipe(value);

			// by spacing the -- or ++ characters, the eval can properly process them
			const prepped = unpiped.replace(/-+|\++/g, s => s.split("").join(" "));

			const result = evalMath(prepped);

			// logQueue.add({label:"retVal",value,result});
			return hasPipes ? `||${result}||` : result;
		});
		// logQueue.add({label:"while",input,output});
	}
	// logQueue.logDiff(output);
	return output;
}
