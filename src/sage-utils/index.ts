export * as default from "./utils";
export * from "./utils/consts";
export * from "./utils/enums";
export * from "./utils/types";

/** Represents an object or a promise to get that object. */
export type Awaitable<T> = T | PromiseLike<T>;

/** Represents an object that can be null or undefined. */
export type Optional<T> = T | null | undefined;

/** Represents an object that can be null. */
export type OrNull<T> = T | null;

/** Represents an object that can be undefined. */
export type OrUndefined<T> = T | undefined;

/** Returns true if the object is NULL or UNDEFINED. */
export function isNullOrUndefined<T>(value: Optional<T>): value is null | undefined {
	return value === null || value === undefined;
}

/** Convenience for !isNullOrUndefined(value) */
export function isDefined<T>(value: Optional<T>): value is T {
	return !isNullOrUndefined(value);
}