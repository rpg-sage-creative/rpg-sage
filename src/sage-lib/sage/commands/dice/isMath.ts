/** Checks the value against regex to determine if it is a simple math equation. */
export function isMath(value: string): boolean {
	const MATH_REGEX = /\[[ \d+\-*/()^]+[+\-*/^]+[ \d+\-*/()^]+\]/i;
	return MATH_REGEX.test(value);
}