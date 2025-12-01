import type { Optional } from "@rsc-utils/core-utils";

const pipeRegex = /\|{2}[^|]+\|{2}/g;

export type UnpipeResults<IsOptional extends boolean = false> = {
	hasPipes: boolean;
	unpiped: IsOptional extends true ? string | undefined : string;
};

/** Checks the value for piped ||spoilered|| text and returns the value without pipes along with the boolean for if pipes were found. */
export function unpipe(value: string): UnpipeResults;

/**
 * Checks the value for piped ||spoilered|| text and returns the value without pipes along with the boolean for if pipes were found.
 * If null or undefined are passed, hasPipes is false and unpiped is undefined.
 */
export function unpipe(value: Optional<string>): UnpipeResults<true>;

export function unpipe(value: Optional<string>): UnpipeResults<any> {
	if (value === null || value === undefined) {
		return { hasPipes:false, unpiped:undefined };
	}

	// check for piped "hidden" values
	const hasPipes = pipeRegex.test(value);

	// remove pipes
	const unpiped = hasPipes
		? value.replace(pipeRegex, piped => piped.slice(2, -2))
		: value;

	return { hasPipes, unpiped };
}