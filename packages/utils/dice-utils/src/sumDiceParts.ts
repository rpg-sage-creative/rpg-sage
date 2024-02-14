import type { TDicePart } from "./dice/DicePart.js";
import { sum } from "./sum.js";
import { DiceOperator } from "./types/DiceOperator.js";

export function sumDiceParts(diceParts: TDicePart[]): number {
	// group the parts such that we only multiply/divide adjacent values; THEN do a sum
	const mathParts: (number | DiceOperator)[] = [];
	diceParts.forEach(dp => {
		mathParts.push(dp.sign ?? "+", dp.total);
	});

	const valuesToAdd: number[] = [];

	let valueToAdd = 0;
	while (mathParts.length) {
		// get sign and value
		const sign = mathParts.shift() as DiceOperator;
		const value = mathParts.shift() as number;

		// if add/sub, push current value and start a new one
		if (sign === "-" || sign === "+") {
			valuesToAdd.push(valueToAdd);
			valueToAdd = value;

		// if mult/div, do the math on the current value
		}else if (sign === "*") {
			valueToAdd *= value;
		}else {
			valueToAdd /= value;
		}
	}
	// add last value
	valuesToAdd.push(valueToAdd);

	return sum(valuesToAdd);
	// return diceParts.reduce((value, dicePart) => {
	// 	switch(dicePart.sign) {
	// 		/** @todo WHY THE EFF IS THIS A + AND NOT A - ???? */
	// 		case "-": return value + dicePart.total;
	// 		case "*": return value * dicePart.total;
	// 		case "/": return value / dicePart.total;
	// 		default: return value + dicePart.total;
	// 	}
	// }, 0);
}