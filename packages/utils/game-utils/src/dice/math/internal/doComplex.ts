import { getNumberRegex, getOrCreateRegex, LogQueue, type RegExpGetOptions, type RegExpSpoilerOptions } from "@rsc-utils/core-utils";
import { regex } from "regex";
import { cleanPipes, unpipe } from "../../internal/pipes.js";
import { doSimple, getSimpleRegex } from "./doSimple.js";

type SageMathFunction = "abs" | "min" | "max" | "floor" | "ceil" | "round" | "hypot";

const SageMath = {
	abs: (...args: number[]) => Math.abs(args[0]),
	min: (...args: number[]) => Math.min(...args),
	max: (...args: number[]) => Math.max(...args),
	floor: (...args: number[]) => Math.floor(args[0]),
	ceil: (...args: number[]) => Math.ceil(args[0]),
	round: (...args: number[]) => {
		const [n, places] = args;
		if (typeof(places) === "number") {
			const mult = Math.pow(10, places);
			return Math.round(n * mult) / mult;
		}
		return Math.round(n);
	},
	hypot: (...args: number[]) => {
		const [x, y, z] = args;
		const xy = Math.hypot(x, y);
		if (typeof(z) === "number") {
			return Math.hypot(xy, z);;
		}
		return xy;
	},
};

type CreateOptions = RegExpGetOptions & RegExpSpoilerOptions<"optional">;

type GetOptions = RegExpGetOptions & RegExpSpoilerOptions<"optional">;

/**
 * Returns a regular expression that finds:
 * abs(number)
 * min(...number[])
 * max(...number[])
 * floor(number)
 * ceil(number)
 * round(number, number?)
 * hypot(number, number, number?)
 */
function createComplexRegex(options?: CreateOptions): RegExp {
	const { iFlag = "", spoilers } = options ?? {};

	const numberRegex = getNumberRegex({ iFlag, spoilers });

	const simpleRegex = getSimpleRegex({ iFlag, spoilers });

	const numberOrSimple = regex(iFlag)`( ${numberRegex} | ${simpleRegex} )`;

	// try atomic group: (?> ${numberOrSimple} \s* ,? )+
	const functionRegex = regex(iFlag)`
		(?<functionName> abs | min | max | floor | ceil | round | hypot )
		\s*\(\s*
		(?<functionArgs>
			${numberOrSimple}           # first number/simple match
			(                           # open non-capture group
				\s*,\s*                 # comma, optional spaces
				${numberOrSimple}       # additional number/simple matches
			)*                          # close non-capture group, allow any number of them
		)
		\s*\)
	`;

	const multiplierRegex = regex(iFlag)`
		(?<multiplier> ${numberRegex} \s* )?
		\(\s*
		(?<simpleMath> ${numberOrSimple} )
		\s*\)
	`;

	return regex(iFlag)`
		(?<!\w)                 # ignore the entire thing if preceded by a word character
		( ${functionRegex} | ${multiplierRegex} )
		(?!\w)                  # ignore the entire thing if followed by a word character
	`;
}

/** @internal Returns a cached instance of the complex math regex. */
export function getComplexRegex(options?: GetOptions): RegExp {
	return getOrCreateRegex(createComplexRegex, options);
}

/** @internal Tests the value against a complex regex using the given options. */
export function hasComplex(value: string, options?: GetOptions): boolean {
	return getComplexRegex(options).test(value);
}

/** @internal Replaces all instances of min/max/floor/ceil/round with the resulting calculated value. */
export function doComplex(input: string, options?: GetOptions): string {
	const logQueue = new LogQueue("doComplex", input);

	let output = input;
	const spoilers = options?.spoilers;

	const complexRegex = createComplexRegex({ gFlag:"g", iFlag:options?.iFlag, spoilers });
	while (complexRegex.test(output)) {
		// because of the way the capture groups use or "|" our array args seem to be the same regardless of the capture group names ...
		output = output.replace(complexRegex, (_, _functionName: string | undefined, _functionArgs: string, _multiplier: string | undefined, _simpleMath: string) => {
			if (!spoilers && unpipe(_).hasPipes) return _;

			let hasPipes = false;

			const retVal = (result: string | number) => {
				logQueue.add({label:"retVal",_,result});
				return hasPipes ? `||${result}||` : String(result);
			};

			// handle a math function
			if (_functionName !== undefined) {
				// lower case and cast type
				const functionName = _functionName.toLowerCase() as SageMathFunction;
				// check function args for pipes
				const functionArgsPipeInfo = unpipe(_functionArgs);
				// update hasPips for the retVal
				hasPipes = functionArgsPipeInfo.hasPipes;
				// split on space,space and convert to numbers
				const functionArgs = functionArgsPipeInfo.unpiped.split(/\s*,\s*/).map(s => +doSimple(s));
				// do the math
				const result = SageMath[functionName](...functionArgs);
				// return a string
				return retVal(result);
			}

			const simpleMathPipeInfo = unpipe(_simpleMath);

			hasPipes = simpleMathPipeInfo.hasPipes;

			// handle a multiplier
			if (_multiplier !== undefined) {
				// return the new math so that it can be reprocessed
				return retVal(`${_multiplier}*${doSimple(simpleMathPipeInfo.unpiped)}`);
			}

			// handle parentheses
			return retVal(`${doSimple(simpleMathPipeInfo.unpiped)}`);
		});

		// remove any parentheses from raw numbers
		output = output.replace(/\(\d+\)/g, value => {
			console.log(value);
			return value.slice(1, -1);
		});

		logQueue.add({label:"while",input,output});
	}

	// logQueue.logDiff(output);

	return spoilers ? cleanPipes(output) : output;
}