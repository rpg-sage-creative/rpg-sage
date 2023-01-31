import type { Optional } from "../..";

export * from "./Comparison/types";

//#region StringMatcher.ts

/** Contains all the properties that represent a StringMatcher. */
export type TStringMatcher = {

	/** Stores StringMatcher.clean(value) */
	clean: string;

	/** Stores string.isBlank(value) */
	isBlank: boolean;

	/** Stores string.toLowerCase() */
	lower: string;

	/** Stores the raw value. */
	value: Optional<string>;
};
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

export type TKeyValueArg = {
	/** key */
	key: string;
	/** key.toLowerCase() */
	keyLower: string;
	/** value (can have spaces) */
	value: string;
	/** keyLower="value" (value can have spaces, not trimmed) */
	clean: string;
	/**
	 * keyLower=value (value can have spaces, trimmed)
	 * @obsolete recode to use .clean or just .value
	 */
	simple: string;
};
