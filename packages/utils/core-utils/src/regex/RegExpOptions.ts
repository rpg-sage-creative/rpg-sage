/** Matches as many as possible, giving back as needed. */
type GreedyQuantifier =
	/** match zero or one */
	"?"

	/** match zero or more */
	| "*"

	/** match one or more */
	| "+"

	/** match exact count */
	| `{${number}}`

	/** match x or more */
	| `{${number},}`

	/** match x to y */
	| `{${number},${number}}`;

/** Matches as few as possible, expanding as needed. */
type LazyQuantifier = `${GreedyQuantifier}?`;

/** Matches as many as possible, without giving back. */
type PossessiveQuantifier = `${GreedyQuantifier}+`;

/** How many tokens to match with a particular RegExp expression. */
export type RegExpQuantifier = GreedyQuantifier | LazyQuantifier | PossessiveQuantifier;

export type RegExpAnchorOptions = {
	/** require the value to be "anchored" to start/end of the string */
	anchored?: boolean;
};

export type RegExpCaptureOptions = {
	/** capture the RegExp with a named capture group */
	capture?: string;
};

export type RegExpFlagOptions = {
	/** include the case insensitive flag in the regex */
	iFlag?: "i" | "";

	/** include the global flag in the regex */
	gFlag?: "g" | "";
};

export type RegExpQuantifyOptions = {
	/** how many to capture */
	quantifier?: RegExpQuantifier;
};

export type RegExpSpoilerOptions<T extends boolean | "optional" = boolean | "optional"> = {
	/** are spoilers allowed or optional */
	spoilers?: T;
};

export type RegExpWrapOptions = {
	/** the characters used to wrap the regex */
	wrapChars?: string;

	/** if the wrap characters are required or not */
	wrapOptional?: boolean;
};
