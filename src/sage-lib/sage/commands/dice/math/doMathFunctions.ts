import { doFloorCeilRound, hasFloorCeilRound } from "./doFloorCeilRound.js";
import { doMinMax, hasMinMax } from "./doMinMax.js";

// export function hasMathFunctions(value: string): boolean {
// 	return hasMinMax(value) || hasFloorCeil(value);
// }

export function doMathFunctions(value: string): string {
	let done = false;
	do {
		if (hasMinMax(value)) {
			value = doMinMax(value);
		}else if (hasFloorCeilRound(value)) {
			value = doFloorCeilRound(value);
		}else {
			done = true;
		}
	}while (!done);
	return value;
}