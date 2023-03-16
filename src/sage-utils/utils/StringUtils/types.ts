import type { Optional } from "../..";

export * from "./Comparison/types";

//#region generic xMatcher

/** An umbrella for various Matching classes */
export type TMatcher = {
	/** Compares a given value. */
	matches(value: TMatcherResolvable): boolean;

	/** Returns the matcher's value or "" if the value was null or undefined. */
	toString(): string;
}

/** Convenience type for Optional<string> | TMatcher */
export type TMatcherResolvable = Optional<string> | TMatcher;

//#endregion

//#region StringMatcher.ts

/** Contains all the properties that represent a StringMatcher. */
export type TStringMatcher = TMatcher & {

	/** Stores StringMatcher.clean(value) */
	clean: string;

	/** Stores string.isBlank(value) */
	isBlank: boolean;

	/** Stores string.toLowerCase() */
	lower: string;

	/** Stores the raw value. */
	value: Optional<string>;
};

/** Convenience type for Optional<string> | TStringMatcher */
export type TStringMatcherResolvable = Optional<string> | TStringMatcher;

//#endregion

//#region Tokenizer.ts

/** A group of regular expressions used for Tokenizer.tokenize() */
export type TParsers = {
	[key: string]: RegExp;
};

/** A token returned from Tokenizer.tokenize() */
export type TToken = {
	token: string;
	type: string;
	matches: string[]
};

//#endregion

export type TKeyValueArg<T extends string = string> = {
	/** key */
	key: string;
	/** key.toLowerCase() */
	keyLower: string;
	/** value (can have spaces) */
	value: T;
	/** keyLower="value" (value can have spaces, not trimmed) */
	clean: string;
	/**
	 * keyLower=value (value can have spaces, trimmed)
	 * @deprecated recode to use .clean or just .value
	 */
	simple: string;
};
