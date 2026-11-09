import { TypedRegExp, TypedRegExpMatchArray, TypedRegExpStringIterator } from "./TypedRegExp";

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

		toUpperCase<Case extends string = Uppercase<string>>(): Case;

	}
}