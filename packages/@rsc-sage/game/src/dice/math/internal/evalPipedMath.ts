import { unpipe } from "../../../utils/pipes/unpipe.js";
import { evalMath } from "../evalMath.js";

/**
 * Uses unpipe to clean the input for use with evalMath() before pipes (if found in the input) in the result.
 * @param input a valid math string that includes spoilered (piped) values.
 */
export function evalPipedMath(input: string): string {
	const { hasPipes, unpiped, startPad, endPad } = unpipe(input);

	const evalResults = evalMath(unpiped);

	const resultString = hasPipes
		? `||${evalResults}||`
		: evalResults;

	return startPad + resultString + endPad;
}