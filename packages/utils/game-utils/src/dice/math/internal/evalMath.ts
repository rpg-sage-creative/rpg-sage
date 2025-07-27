import { error } from "@rsc-utils/core-utils";

export function evalMath(prepped: string): string {
	try {
		// do the math
		const outValue = eval(prepped);

		// it is possible to eval to undefined, treat as an error
		if (outValue === null || outValue === undefined || isNaN(outValue)) {
			return `(NaN)`;
		}

		// if the evaluated number is a negative, it will start with -, allowing math/parsing to continue
		// therefore, we should leave a + if a sign was present before the eval() call and the result is positive
		const outStringValue = String(outValue);//.trim();
		const signRegex = /^[+-]/;
		const result = signRegex.test(prepped.trim()) && !signRegex.test(outStringValue)
			? `+${outStringValue}`
			: outStringValue;

		return result;

	}catch(ex) {
		error(prepped);
		return `(ERR)`;
	}
}
