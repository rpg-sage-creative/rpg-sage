import { error, toLiteral, warn } from "@rsc-utils/core-utils";

type Options = "error" | "warn";

export function tagFailure(arg: TemplateStringsArray, ...args: unknown[]): false;
export function tagFailure(arg: Options): (arg: TemplateStringsArray, ...args: unknown[]) => false;
export function tagFailure(arg: Options | TemplateStringsArray, ...args: unknown[]) {
	// process template
	if (Array.isArray(arg)) {
		error(arg.reduce((out, s) => out + s + (args.length ? toLiteral(args.shift()) : ""), ""));
		return false;
	}

	// return function to process template
	return (strings: TemplateStringsArray, ..._args: unknown[]) => {
		const logger = arg === "warn" ? warn : error;
		logger(strings.reduce((out, s) => out + s + (_args.length ? toLiteral(_args.shift()) : ""), ""));
		return false;
	};
}