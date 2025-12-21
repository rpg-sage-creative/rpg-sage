import { getOrCreateRegex, NumberRegExp, type RegExpAnchorOptions, type RegExpCaptureOptions, type RegExpFlagOptions, type RegExpSpoilerOptions } from "@rsc-utils/core-utils";

type Options = RegExpAnchorOptions & RegExpCaptureOptions & RegExpFlagOptions & RegExpSpoilerOptions;

/** A reusable way to get proper regex for a valid +/- integer or decimal. */
export function getNumberRegex(options?: Options): RegExp {
	return getOrCreateRegex(() => NumberRegExp, options);
}
