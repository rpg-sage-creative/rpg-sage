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
export type TToken<Type extends string = string> = {
	token: string;
	type: Type;
	matches: string[]
};

//#endregion

export type TKeyValueArg = {
	key: string;
	keyLower: string;
	value: string;
	clean: string;
};
