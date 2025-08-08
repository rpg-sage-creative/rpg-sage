
/** Make all properties in T type Optional */
export type Args<T> = { [P in keyof T]?: Optional<T[P]>; };

/** Represents an object or a promise to get that object. */
export type Awaitable<T> = T | PromiseLike<T>;

/** Represents an unknown class constructor. */
export type Constructable<T extends {} = {}> = new (...args: any[]) => T;

/** Represents an enum with string key and number value. */
export type EnumLike<K extends string = string, V extends number = number> = Record<K, V>;

/** Represents a conditional data type. */
export type If<T extends boolean, A, B = undefined> = T extends true ? A : T extends false ? B : A | B;

/** Represents an object that can be null or undefined. */
export type Optional<T> = T | null | undefined;

/** Represents an object that can be null. */
export type OrNull<T> = T | null;

/** Represents an object that can be undefined. */
export type OrUndefined<T> = T | undefined;

declare global {
	interface String {
		toLowerCase<Case extends string = Lowercase<string>>(): Case;
	}
}