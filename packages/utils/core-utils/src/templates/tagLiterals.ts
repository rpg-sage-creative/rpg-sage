import { toLiteral, type Options } from "./toLiteral.js";

/**
 * A template function that calls toLiteral on every value passed into the template.
 * Example: tagLiterals`madeUpFn(${firstArg}, ${secondArg})` is the same as `madeUpFn(${toLiteral(firstArg)}, ${toLiteral(secondArg)})`.
 */
export function tagLiterals(arg: TemplateStringsArray, ...args: unknown[]): string;

/**
 * Generates a tagLiterals template function that uses the given Options when calling toLiteral().
 * Example: tagLiterals({ellipses:["obj.child"]})`madeUpFn(${firstArg}, ${secondArg})` is the same as `madeUpFn(${toLiteral(firstArg, {ellipses:["obj.child"]})}, ${toLiteral(secondArg, {ellipses:["obj.child"]})})`.
 */
export function tagLiterals(arg: Options): (arg: TemplateStringsArray, ...args: unknown[]) => string;

export function tagLiterals(arg: Options | TemplateStringsArray, ...args: unknown[]) {
	// return the templated string
	if (Array.isArray(arg)) {
		return arg.reduce((out, s) => out + s + (args.length ? toLiteral(args.shift()) : ""), "");
	}

	// return a template function with options
	return (strings: TemplateStringsArray, ..._args: unknown[]) => {
		return strings.reduce((out, s) => out + s + (_args.length ? toLiteral(_args.shift(), arg as Options) : ""), "");
	};
}