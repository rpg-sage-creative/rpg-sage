import { createCloseTagSource, createSelfCloseSource, type Flags } from "./internal/helpers.js";

type Options = { flags?:Flags; };

export function createHtmlTagRegex(options?: Options): RegExp {
	const source = `(${createCloseTagSource(options)}|${createSelfCloseSource(options)})`;
	return new RegExp(source, options?.flags);
}
