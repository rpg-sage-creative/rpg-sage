export function isMath(value: string): boolean {
	const MATH_REGEX = /\[[ \d+\-*/()^]+[+\-*/^]+[ \d+\-*/()^]+\]/i;
	return MATH_REGEX.test(value);
}