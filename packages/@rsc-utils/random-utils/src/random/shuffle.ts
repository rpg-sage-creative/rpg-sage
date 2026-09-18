import { randomInt } from "node:crypto";

/**
 * Creates a new array by randomly reordering the contents of the given array.
 * To ensure duplicate values don't alter the shuffle logic, arrays will be shuffled by index, not by value.
 * Arrays without at least two values will be returned unshuffled.
 * @todo implement args { count:number; style:"clean" (perfect deck shuffle; 8x shuffles resets deck) | "unclean" (like clean but randomly shift index by 1 or 2) | "randmize" (what we do below)}
*/
export function shuffle<T>(array: T[]): T[] {
	// we cannot shuffle with less than 2 items
	const itemCount = array.length;
	if (itemCount < 2) {
		return array.slice();
	}

	// we shuffle by index to account for the possibility that some values are equal
	const shuffled = array.map((_,index) => index);

	do {
		// for each index, let's generate a new index to put that value in
		for (let currentIndex = 0; currentIndex < itemCount; currentIndex++) {
			// get a new random index
			const randomIndex = randomInt(itemCount);

			// switch index values
			const value = shuffled[currentIndex]!;
			shuffled[currentIndex] = shuffled[randomIndex]!;
			shuffled[randomIndex] = value;
		}
	// ensure that we have index values that differ from their original index
	}while (!shuffled.some((value, index) => value !== index));

	// map the indexes back to their values
	return shuffled.map(index => array[index]!);
}
