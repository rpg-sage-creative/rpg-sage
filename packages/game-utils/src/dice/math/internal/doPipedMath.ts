import { evalPipedMath } from "./evalPipedMath.js";

/**
 * @internal
 * As long as the value matches the testRegExp, the replaceRegExp is used and passed to evalPipedMath.
 * Designed for use with doPosNeg and doSimple; they were identical except for the RegExp being used.
 */
export function doPipedMath(input: string, testRegExp: RegExp, replaceRegExp: RegExp): string {
	let output = input;

	// iterate while we have matches
	while (testRegExp.test(output)) {
		// track value before changes
		const before = output;

		// replace all matches
		output = output.replace(replaceRegExp, evalPipedMath);

		// in case nothing changed (false positive), break out of the loop
		if (before === output) break;
	}

	return output;
}