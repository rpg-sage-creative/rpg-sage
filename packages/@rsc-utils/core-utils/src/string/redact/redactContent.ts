import type { Optional } from "@rsc-utils/type-utils";
import { redactCodeBlocks, type RedactCodeBlocksOptions } from "./redactCodeBlocks.js";
import { redactKeyValuePairs, type RedactKeyValuePairsOptions } from "./redactKeyValuePairs.js";
import { redactMdLinks, type RedactMdLinksOptions } from "./redactMdLinks.js";
import type { RedactOptions } from "./RedactOptions.js";

type RedactContentOptions = RedactOptions & {
	codeBlocks?: boolean | RedactCodeBlocksOptions;
	keyValuePairs?: boolean | RedactKeyValuePairsOptions;
	mdLinks?: boolean | RedactMdLinksOptions;
};

/** Redacts codeBlocks, keyValuePairs, and mdLinks with a "*" char. */
export function redactContent(content: string): string;

/** Redacts codeBlocks, keyValuePairs, and mdLinks with redactedCharacter. */
export function redactContent(content: string, redactedCharacter: string | undefined): string;

/** All options default to true unless given as false. */
export function redactContent(content: string, options?: RedactContentOptions): string;

/** Redacts codeBlocks, keyValuePairs, and mdLinks with a "*" char. */
export function redactContent(content: Optional<string>): Optional<string>;

/** Redacts codeBlocks, keyValuePairs, and mdLinks with redactedCharacter. */
export function redactContent(content: Optional<string>, redactedCharacter: string | undefined): Optional<string>;

/** All options default to true unless given as false. */
export function redactContent(content: Optional<string>, options?: RedactContentOptions): Optional<string>;

export function redactContent(content: Optional<string>, charOrOpts?: string | RedactContentOptions): Optional<string> {
	if (!content) return content;

	const { codeBlocks, keyValuePairs, mdLinks, ...defaults } = typeof(charOrOpts) === "string"
		? { char:charOrOpts }
		: charOrOpts ?? {};

	if (codeBlocks !== false) {
		const opts: RedactCodeBlocksOptions = codeBlocks === true ? defaults : { ...defaults, ...codeBlocks };
		content = redactCodeBlocks(content, opts);
	}

	if (keyValuePairs !== false) {
		const opts: RedactKeyValuePairsOptions = keyValuePairs === true ? defaults : { ...defaults, ...keyValuePairs };
		content = redactKeyValuePairs(content, opts);
	}

	if (mdLinks !== false) {
		const opts: RedactMdLinksOptions = mdLinks === true ? defaults : { ...defaults, ...mdLinks };
		content = redactMdLinks(content, opts);
	}

	return content;
}