import { nth } from "@rsc-utils/core-utils";
import { xRegExp } from "../internal/xRegExp.js";
import { doSimple, getSimpleRegex } from "./doSimple.js";
import { getNumberRegex } from "./getNumberRegex.js";
import { unpipe } from "./unpipe.js";

type Options = {
	allowSpoilers?: boolean;
	globalFlag?: boolean;
};

/** Returns a regular expression that finds:
 * abs(number)
 * ceil(number)
 * floor(number)
 * hypot(number, number, number?)
 * max(...number[])
 * min(...number[])
 * nth(number)
 * round(number, number?)
 * sign(number)
 * signed(number)
 */
export function getComplexRegex(options?: Options): RegExp {
	const flags = options?.globalFlag ? "xgi" : "xi";
	const numberRegex = getNumberRegex({ allowSpoilers:options?.allowSpoilers }).source;
	const simpleRegex = getSimpleRegex({ allowSpoilers:options?.allowSpoilers }).source;
	const numberOrSimple = `(?:${numberRegex}|${simpleRegex})`;
	return xRegExp(`
		(?<!\\d*d\\d+)                  # ignore the entire thing if preceded by dY or XdY

		(?:                             # open non-capture group for multiplier/function
			(${numberRegex})\\s*        # capture a multiplier, ex: 3(4-2) <-- 3 is the multiplier
			|
			(abs|ceil|floor|hypot|max|min|nth|round|sign|signed)  # capture a math function
		)?                              # close non-capture group for multiplier/function; make it optional

		\\(\\s*                         # open parentheses, optional spaces
		(                               # open capture group
			${numberOrSimple}           # first number/simple match
			(?:                         # open non-capture group
				\\s*,\\s*               # comma, optional spaces
				${numberOrSimple}       # additional number/simple matches
			)*                          # close non-capture group, allow any number of them
		)                               # close capture group
		\\s*\\)                         # close parentheses, optional spaces

		(?!\\d*d\\d)                    # ignore the entire thing if followed by dY or XdY
	`, flags);
}

/** Convenience for getMathFunctionRegex().test(value) */
export function hasComplex(value: string, options?: Omit<Options, "globalFlag">): boolean {
	return getComplexRegex(options).test(value);
}

type SageMathFunction = keyof typeof SageMath;

const SageMath = {
	abs: (...args: number[]) => Math.abs(args[0]),
	ceil: (...args: number[]) => Math.ceil(args[0]),
	floor: (...args: number[]) => Math.floor(args[0]),
	hypot: (...args: number[]) => {
		const [x, y, z] = args;
		const xy = Math.hypot(x, y);
		if (typeof(z) === "number") {
			return Math.hypot(xy, z);;
		}
		return xy;
	},
	max: (...args: number[]) => Math.max(...args),
	min: (...args: number[]) => Math.min(...args),
	nth: (...args: number[]) => nth(args[0]),
	round: (...args: number[]) => {
		const [n, places] = args;
		if (typeof(places) === "number") {
			const mult = Math.pow(10, places);
			return Math.round(n * mult) / mult;
		}
		return Math.round(n);
	},
	sign: (...args: number[]) => Math.sign(args[0]),
	signed: (...args: number[]) => {
		const [n] = args;
		if (n < 0) {
			return n;
		}
		return `+${n}`;
	},
}

/** Checks the value for min/max/floor/ceil/round and replaces it with the result. */
export function doComplex(input: string, options?: Omit<Options, "globalFlag">): string {
	let output = input;
	const regex = getComplexRegex({ globalFlag:true, ...options });
	while (regex.test(output)) {
		output = output.replace(regex, (_, _multiplier: string | undefined, _functionName: string | undefined, _args: string) => {
			const { hasPipes, unpiped } = unpipe(_args);

			const retVal = (result: string | number) => {
				return hasPipes ? `||${result}||` : String(result);
			};

			// split on space,space and convert to numbers
			const args = unpiped.split(/\s*,\s*/).map(s => +doSimple(s)!);

			// handle a math function
			if (_functionName !== undefined) {
				// lower case and cast type
				const functionName = _functionName.toLowerCase() as SageMathFunction;
				// do the math
				const result = SageMath[functionName](...args);
				// return a string
				return retVal(result);
			}

			if (_multiplier !== undefined) {
				// return the new math so that it can be reprocessed
				return retVal(`${_multiplier}*${args[0]}`);
			}

			return retVal(`${args[0]}`);
		});
	}
	return output;
}