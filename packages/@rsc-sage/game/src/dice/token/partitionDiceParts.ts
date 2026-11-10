import type { TDicePart } from "../dice/DicePart.js";

export function partitionDiceParts(diceParts: TDicePart[]): TDicePart[][] {
	let currentDice: TDicePart[];
	const partedDice: TDicePart[][] = [];
	diceParts.forEach(dicePart => {
		if (!currentDice
			|| dicePart.hasDie && !dicePart.sign
			|| dicePart.hasTest && currentDice.find(_dicePart => _dicePart.hasTest)) {
			currentDice = [];
			partedDice.push(currentDice);
		}
		currentDice.push(dicePart);
	});
	return partedDice.filter(array => array.length);
}