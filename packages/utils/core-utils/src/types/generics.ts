
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

/** Applies the given Groups type to the groups value of the underlying RegExpExecArray. */
export type TypedRegExpMatchArray<
			Groups extends Record<Keys, Values>,
			Keys extends string = string,
			Values extends string | undefined = string | undefined
		>
	= RegExpMatchArray & { groups:Groups; };

/** Applies the given Groups type to the groups value of the underlying RegExpExecArray. */
export type TypedRegExpExecArray<
			Groups extends Record<Keys, Values>,
			Keys extends string = string,
			Values extends string | undefined = string | undefined
		>
	= RegExpExecArray & { groups:Groups; };

/** Applies the given Groups type to the groups value of the underlying RegExpExecArray values. */
export type TypedRegExpStringIterator<
			Groups extends Record<Keys, Values>,
			Keys extends string = string,
			Values extends string | undefined = string | undefined
		>
	= RegExpStringIterator<TypedRegExpExecArray<Groups, Keys, Values>>;

export interface TypedRegExp<
			Groups extends Record<Keys, Values>,
			Keys extends string = string,
			Values extends string | undefined = string | undefined
		> extends RegExp {
	exec(string: string): TypedRegExpExecArray<Groups> | null;
}

declare global {
	interface String {
		match<
				Groups extends Record<Keys, Values>,
				Keys extends string = string,
				Values extends string | undefined = string | undefined
			>(matcher: TypedRegExp<Groups>): TypedRegExpMatchArray<Groups>;

		matchAll<
				Groups extends Record<Keys, Values>,
				Keys extends string = string,
				Values extends string | undefined = string | undefined
			>(regexp: TypedRegExp<Groups>): TypedRegExpStringIterator<Groups>;

		toLowerCase<Case extends string = Lowercase<string>>(): Case;
	}
}