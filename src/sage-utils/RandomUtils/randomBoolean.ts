import { random } from "./random";

/** Randomly returns true or a false. */
export function randomBoolean(): boolean {
	return random(1, 2) === 2;
}
