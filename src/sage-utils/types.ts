
/** Make all properties in T type Optional */
export type Args<T> = { [P in keyof T]?: Optional<T[P]>; };

/** Represents an object or a promise to get that object. */
export type Awaitable<T> = T | PromiseLike<T>;

/** Represents an object that can be null or undefined. */
export type Optional<T> = T | null | undefined;

/** Represents an object that can be null. */
export type OrNull<T> = T | null;

/** Represents an object that can be undefined. */
export type OrUndefined<T> = T | undefined;

/** Represents a conditional data type. */
export type If<T extends boolean, A, B = undefined> = T extends true ? A : T extends false ? B : A | B;

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
