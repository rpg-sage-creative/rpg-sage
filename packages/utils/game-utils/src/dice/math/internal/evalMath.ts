import { error } from "@rsc-utils/core-utils";

const SignPrefixRegExp = /^[+-]/;

const LeadingZeroRegExp = /\b(?<!\d\.)0+([1-9])/g;

/** Finds all numbers with leading zeros and removes the leading zeros. */
function stripLeadingZeros(input: string): string {
	return input.replaceAll(LeadingZeroRegExp, (_, num) => num);
}

export function evalMath(prepped: string): string {
	try {
		// Numbers with leading zeros get treated as octal, which is not allowed in strict mode.
		const octalSafe = stripLeadingZeros(prepped);

		// do the math
		const outValue = eval(octalSafe);

		// it is possible to eval to undefined, treat as an error
		if (outValue === null || outValue === undefined || isNaN(outValue)) {
			return `(NaN)`;
		}

		// if the evaluated number is a negative, it will start with -, allowing math/parsing to continue
		// therefore, we should leave a + if a sign was present before the eval() call and the result is positive
		const outStringValue = String(outValue);
		const result = SignPrefixRegExp.test(prepped.trim()) && !SignPrefixRegExp.test(outStringValue)
			? `+${outStringValue}`
			: outStringValue;

		return result;

	}catch(ex) {
		error(`evalMath threw an exception for: ${prepped}`, ex);
		return `(ERR)`;
	}
}
