const pipeRegex = /\|{2}[^|]+\|{2}/g;

/** Checks the value for piped ||spoilered|| text and returns the value without pipes along with the boolean for if pipes were found. */
export function unpipe(value: string) {

	// check for piped "hidden" values
	const hasPipes = pipeRegex.test(value);

	// remove pipes
	const unpiped = hasPipes
		? value.replace(pipeRegex, piped => piped.slice(2, -2))
		: value;

	return { hasPipes, unpiped };
}