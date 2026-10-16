
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
	}
}