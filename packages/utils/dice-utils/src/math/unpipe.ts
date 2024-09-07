/** @internal */
export function unpipe(value: string) {
	const pipeRegex = /\|{2}[^|]+\|{2}/g;

	// check for piped "hidden" values
	const hasPipes = pipeRegex.test(value);

	// remove pipes
	const unpiped = hasPipes
		? value.replace(pipeRegex, piped => piped.slice(2, -2))
		: value;

	return { hasPipes, unpiped };
}