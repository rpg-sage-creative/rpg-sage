import { globalizeRegex, type Optional, type OrNull, type OrUndefined } from "@rsc-utils/core-utils";

const PipeSpoilerRegExp = /\|{2}[^|]+\|{2}/;
const PipeSpoilerRegExpG = globalizeRegex(PipeSpoilerRegExp);

export type UnpipeResults<Type extends string | undefined | null> = {
	hasPipes: boolean;
	unpiped: Type;
	value: Type;
};

/** Removes pipe spoilers from the value, returning the unpiped value and a flag specifiying if the original has pipes. */
export function unpipe(value: string): UnpipeResults<string>;
export function unpipe(value: OrNull<string>): UnpipeResults<OrNull<string>>;
export function unpipe(value: OrUndefined<string>): UnpipeResults<OrUndefined<string>>;
export function unpipe(value: Optional<string>): UnpipeResults<Optional<string>>;
export function unpipe(value: Optional<string>): UnpipeResults<Optional<string>> {
	if (!value) {
		return { value, hasPipes:false, unpiped:value };
	}

	// check for piped "hidden" values
	let hasPipes = false;

	// remove pipes
	let unpiped = value;
	while (PipeSpoilerRegExp.test(unpiped)) {
		hasPipes = true;
		unpiped = unpiped.replace(PipeSpoilerRegExpG, piped => piped.slice(2, -2));
	};

	return { value, hasPipes, unpiped };
}

const NestedPipeRegExp = /\|{2}.*?\|{2}[^|]+\|{2}.*?\|{2}/;
const NestedPipeRegExpG = globalizeRegex(NestedPipeRegExp);

/** Cleans instances of nested pipes by removing inner pipes. */
export function cleanPipes(value: string): string {
	while (NestedPipeRegExp.test(value)) {
		value = value.replace(NestedPipeRegExpG, outer => {
			// remove the outer pipes
			const inner = outer.slice(2, -2);
			// remove all inner pipes
			const { unpiped } = unpipe(inner);
			// put other pipes back
			return "||" + unpiped + "||";
		});
	}
	return value;
}