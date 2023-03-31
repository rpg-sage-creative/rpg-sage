import { generate } from "./generate";

/** Randomly returns true or a false. */
export function randomBoolean(): boolean {
	return generate(1, 2) === 2;
}
