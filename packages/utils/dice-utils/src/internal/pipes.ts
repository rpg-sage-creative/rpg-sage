
let pipeRegex: RegExp;
function getPipeRegex(): RegExp {
	return pipeRegex ?? (pipeRegex = /\|{2}[^|]+\|{2}/g);
}

/** @internal */
export function hasPipes(value: string): boolean {
	return getPipeRegex().test(value);
}

/** @internal */
export function unpipe(value: string) {
	const pipeRegex = getPipeRegex();

	// check for piped "hidden" values
	let hasPipes = false;

	// remove pipes
	let unpiped = value;
	while (pipeRegex.test(unpiped)) {
		hasPipes = true;
		unpiped = unpiped.replace(pipeRegex, piped => piped.slice(2, -2));
	};

	return { hasPipes, unpiped };
}

let nestedPipeRegex: RegExp;
function getNestedPipeRegex(): RegExp {
	return nestedPipeRegex ?? (nestedPipeRegex = /\|{2}.*?\|{2}[^|]+\|{2}.*?\|{2}/g);
}

/** @internal */
export function cleanPipes(value: string): string {
	const nestedRegex = getNestedPipeRegex();

	while (nestedRegex.test(value)) {
		value = value.replace(nestedRegex, outer => {
			const { unpiped } = unpipe(outer.slice(2, -2));
			return `||${unpiped}||`;
		});
	}

	return value;
}