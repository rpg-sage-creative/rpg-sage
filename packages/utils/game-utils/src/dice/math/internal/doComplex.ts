import { globalizeRegex, hypot, nth, NumberRegExp, round, signed } from "@rsc-utils/core-utils";
import { regex } from "regex";
import { cleanPipes, unpipe } from "../../../utils/pipes.js";
import { doSimple, OrSpoileredSimpleMathRegExp } from "./doSimple.js";

type SageMathFunction = keyof typeof SageMath;

const SageMath = {
	abs: (...args: number[]) => Math.abs(args[0]!),
	ceil: (...args: number[]) => Math.ceil(args[0]!),
	floor: (...args: number[]) => Math.floor(args[0]!),
	hypot: (...args: number[]) => hypot(args[0]!, args[1]!, args[2]!),
	max: (...args: number[]) => Math.max(...args),
	min: (...args: number[]) => Math.min(...args),
	nth: (...args: number[]) => nth(args[0]!),
	round: (...args: number[]) => round(args[0]!, args[1]!),
	sign: (...args: number[]) => Math.sign(args[0]!),
	signed: (...args: number[]) => signed(args[0]!),
};

export const ComplexMathRegExp = regex("i")`
	(?<!\w)                 # ignore the entire thing if preceded by a word character

	(
		# functions
		(?<functionName>
			abs | ceil | floor | hypot | max | min | nth | round | sign | signed
		)
		\s*\(\s*
		(?<functionArgs>
			\g<numberOrSimple>          # first number/simple match
			(                           # open non-capture group
				\s*,\s*                 # comma, optional spaces
				\g<numberOrSimple>      # additional number/simple matches
			)*                          # close non-capture group, allow any number of them
		)
		\s*\)

	|
		# implicit multiplication
		(?<multiplier>
			\g<orSpoileredNumber>
			\s*
		)?
		\(\s*
		(?<simpleMath>
			\g<orSpoileredSimpleMath>
		)
		\s*\)
	)

	(?!\w)                  # ignore the entire thing if followed by a word character

	(?(DEFINE)
		(?<numberOrSimple> \g<orSpoileredNumber> | \g<orSpoileredSimpleMath> )
		(?<orSpoileredSimpleMath> ${OrSpoileredSimpleMathRegExp} )
		(?<orWrappedNumber> \( \g<orSpoileredNumber> \) | \g<orSpoileredNumber> )
		(?<orSpoileredNumber> \|\| \g<number> \|\| | \g<number> )
		(?<number> ${NumberRegExp} )
	)
`;

const ComplexMathRegExpG = globalizeRegex(ComplexMathRegExp);


/** @internal Tests the value against a complex regex using the given options. */
export function hasComplex(value: string): boolean {
	return ComplexMathRegExp.test(value);
}

/** @internal Replaces all instances of min/max/floor/ceil/round with the resulting calculated value. */
export function doComplex(input: string): string {
	let output = input;
	while (ComplexMathRegExp.test(output)) {
		// because of the way the capture groups use or "|" our array args seem to be the same regardless of the capture group names ...
		output = output.replace(ComplexMathRegExpG, (_, _functionName: string | undefined, _functionArgs: string, _multiplier: string | undefined, _simpleMath: string) => {
			// if (!allowSpoilers && unpipe(_).hasPipes) return _;

			let hasPipes = false;

			const retVal = (result: string | number) => {
				return hasPipes ? `||${result}||` : String(result);
			};

			// handle a math function
			if (_functionName !== undefined) {console.debug({_functionName})
				// lower case and cast type
				const functionName = _functionName.toLowerCase() as SageMathFunction;
				// check function args for pipes
				const functionArgsPipeInfo = unpipe(_functionArgs);
				// update hasPips for the retVal
				hasPipes = functionArgsPipeInfo.hasPipes;
				// split on space,space and convert to numbers
				const functionArgs = functionArgsPipeInfo.unpiped.split(",").map(s => +doSimple(s.trim()));
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
	}

	// return allowSpoilers ? cleanPipes(output) : output;
	return cleanPipes(output);
}