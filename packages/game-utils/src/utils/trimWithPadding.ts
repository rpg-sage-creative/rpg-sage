import type { Optional } from "@rsc-utils/core-utils";

type Result<Type extends Optional<string> = string> = {
	endPad: string;
	trimmed: Type;
	startPad: string;
};

/** Trims a string and returns the padLengths with the trimmed value. */
export function trimWithPadding(value: string): Result;
export function trimWithPadding(value: Optional<string>): Result<Optional<string>>;
export function trimWithPadding(value: Optional<string>): Result<Optional<string>> {
	if (!value) {
		return { endPad:"", trimmed:value, startPad:"" };
	}

	// trim start and capture padding
	const startTrimmed = value.trimStart();
	const startPad = value.slice(0, value.length - startTrimmed.length);

	// trim end and capture padding
	const trimmed = startTrimmed.trimEnd();
	const endPad = startTrimmed.slice(trimmed.length);

	return { endPad, startPad, trimmed };
}