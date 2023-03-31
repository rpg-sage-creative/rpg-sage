import { generate } from "./generate";

/**
 * Creates a new array by randomly reordering the contents of the given array.
 * Will never return an unshuffled array.
*/
export function shuffle<T>(array: T[]): T[] {
	const shuffled = array.slice();
	do {
		let currentIndex = shuffled.length;
		while (0 !== currentIndex) {
			const randomIndex = generate(1, currentIndex) - 1;
			currentIndex -= 1;
			const temporaryValue = shuffled[currentIndex];
			shuffled[currentIndex] = shuffled[randomIndex];
			shuffled[randomIndex] = temporaryValue;
		}
	}while (!shuffled.find((value, index) => value !== array[index]));
	return shuffled;
}
