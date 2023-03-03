import * as _XRegExp from "xregexp";
import type { Optional, TKeyValueArg } from "../..";
const XRegExp: typeof _XRegExp = (_XRegExp as any).default;

import { default as createEmojiRegex } from "emoji-regex";

export * as Comparison from "./Comparison";
export * as Markdown from "./Markdown";
export { default as StringMatcher } from "./StringMatcher";
export * as Tokenizer from "./Tokenizer";

//#region (Single Quotes, Double Quotes, Dequote)
/*
// const DOUBLE_ARROW_LEFT = "\u00AB";
// const DOUBLE_ARROW_RIGHT = "\u00BB";
// const DOUBLE_REGEX = XRegExp(`[${DOUBLE_LEFT}${DOUBLE_RIGHT}]`, "g");
*/

/*
// const SINGLE = "\u0027";
// const SINGLE_LEFT = "\u2018";
// const SINGLE_RIGHT = "\u2019";
// const SINGLE_LEFT_LOW = "\u201A";
// const SINGLE_ARROW_LEFT = "\u2039";
// const SINGLE_ARROW_RIGHT = "\u203A";
// const SINGLE_ENGLISH = `${SINGLE_LEFT}[^${SINGLE_RIGHT}]*${SINGLE_RIGHT}`;
// const SINGLE_REGEX = XRegExp(`[${SINGLE_LEFT}${SINGLE_RIGHT}]`, "g");
*/
/*
// const DOUBLE = "\u0022";
// const DOUBLE_LEFT = "\u201C";
// const DOUBLE_RIGHT = "\u201D";
// const DOUBLE_LEFT_LOW = "\u201E";
*/

/*
// const DOUBLE_ENGLISH = `${DOUBLE_LEFT}[^${DOUBLE_RIGHT}]*${DOUBLE_RIGHT}`;
// const DOUBLE_FRENCH = `${DOUBLE_ARROW_LEFT}[^${DOUBLE_ARROW_RIGHT}]*${DOUBLE_ARROW_RIGHT}`;
// const DOUBLE_GERMAN = `${DOUBLE_LEFT_LOW}[^${DOUBLE_LEFT}]*${DOUBLE_LEFT}`;
// const DOUBLE_POLISH = `${DOUBLE_LEFT_LOW}[^${DOUBLE_RIGHT}]*${DOUBLE_RIGHT}`;
// const DOUBLE_SWEDISH = `${DOUBLE_ARROW_RIGHT}[^${DOUBLE_ARROW_LEFT}]*${DOUBLE_ARROW_LEFT}`;
// const DOUBLE_UNIVERSAL = `${DOUBLE}[^${DOUBLE}]*${DOUBLE}`;
*/

/*
// const DEQUOTE_REGEX = XRegExp(`^[${DOUBLE}${DOUBLE_LEFT}${DOUBLE_LEFT_LOW}][^${DOUBLE}${DOUBLE_LEFT}${DOUBLE_LEFT_LOW}${DOUBLE_RIGHT}]*[${DOUBLE}${DOUBLE_LEFT}${DOUBLE_RIGHT}]$`);
// const DEQUOTE_REGEX_STRICT = XRegExp(`^(${DOUBLE_ENGLISH}|${DOUBLE_GERMAN}|${DOUBLE_POLISH}|${DOUBLE_UNIVERSAL})$`);
*/

//#endregion

/**
 * Capitalizes the first letter of the given string.
 * If a splitter is given, each substring will be capitalized.
 * If a joiner is given, it will be used to separate the subsections.
 */
export function capitalize(value: string): string;
export function capitalize(value: string, splitter: string | RegExp): string;
export function capitalize(value: string, splitter: string | RegExp, joiner: string): string;
export function capitalize(value: string, splitter?: string | RegExp, joiner?: string): string {
	if (isBlank(value)) {
		return value;
	}
	if (splitter === null || splitter === undefined) {
		return value.charAt(0).toUpperCase() + value.slice(1);
	}
	return value
		.split(splitter)
		.map(s => capitalize(s))
		.join(joiner ?? (typeof(splitter) == "string" ? splitter : ""));
}

//#region chunk

type TChunkOptionsMaxChunkLengthCallback = (chunkIndex: number) => number;
export type TChunkOptions = {
	lineSplitter: string | RegExp;
	maxChunkLength: number | TChunkOptionsMaxChunkLengthCallback;
	newLineCharacter: string;
	spaceCharacter: string;
	wordSplitter: string | RegExp;
};

function isMaxChunkLengthOrCallback(maxChunkLength: any): maxChunkLength is number | TChunkOptionsMaxChunkLengthCallback {
	return ["function", "number"].includes(typeof(maxChunkLength));
}
function numberToChunkOptions(maxChunkLength: number | TChunkOptionsMaxChunkLengthCallback, options?: TChunkOptions): TChunkOptions {
	return {
		lineSplitter: options?.lineSplitter ?? "\n",
		maxChunkLength: options?.maxChunkLength ?? maxChunkLength,
		newLineCharacter: options?.newLineCharacter ?? "\n",
		wordSplitter: options?.wordSplitter ?? " ",
		spaceCharacter: options?.spaceCharacter ?? " "
	};
}
function optionsToChunkOptions(optionsOne?: TChunkOptions, optionsTwo?: TChunkOptions): TChunkOptions {
	return {
		lineSplitter: optionsTwo?.lineSplitter ?? optionsOne?.lineSplitter ?? "\n",
		maxChunkLength: optionsTwo?.maxChunkLength ?? optionsOne?.maxChunkLength!,
		newLineCharacter: optionsTwo?.newLineCharacter ?? optionsOne?.newLineCharacter ?? "\n",
		wordSplitter: optionsTwo?.wordSplitter ?? optionsOne?.wordSplitter ?? " ",
		spaceCharacter: optionsTwo?.spaceCharacter ?? optionsOne?.spaceCharacter ?? " "
	};
}
function parseChunkOptions(argOne?: number | TChunkOptions | TChunkOptionsMaxChunkLengthCallback, argTwo?: TChunkOptions): TChunkOptions {
	if (isMaxChunkLengthOrCallback(argOne)) {
		return numberToChunkOptions(argOne, argTwo);
	}
	return optionsToChunkOptions(argOne, argTwo);
}

type TChunkInfo = {
	chunks: string[];
	currentChunk: string;
	currentIndex: number;
	maxChunkLength: TChunkOptionsMaxChunkLengthCallback;
};

/** Splits input into chunks using lineSplitter (default "\n") and wordSplitter (default " "), ensuring that no "chunk" is greater than maxChunkLength. */
export function chunk(input: string): string[];
export function chunk(input: string, opts: TChunkOptions): string[];
export function chunk(input: string, maxChunkLength: number): string[];
export function chunk(input: string, maxChunkLengthCallback: TChunkOptionsMaxChunkLengthCallback): string[];
// export function chunk(input: string, maxChunkLength: number, opts: TChunkOptions): string[];
export function chunk(input: string, argOne?: number | TChunkOptions | TChunkOptionsMaxChunkLengthCallback, argTwo?: TChunkOptions): string[] {
	const options = parseChunkOptions(argOne, argTwo);

	// Split into lines
	const lines = input.split(options.lineSplitter);

	// If there is no maxChunkLength, return them as is
	if (typeof options.maxChunkLength !== "function" && (options.maxChunkLength ?? 0) <= 0) {
		return lines;
	}

	//TODO: tokenize to ensure we don't break html / markdown

	const info: TChunkInfo = {
		chunks: [],
		currentChunk: "",
		currentIndex: 0,
		maxChunkLength: typeof options.maxChunkLength === "function"
			? options.maxChunkLength
			: () => options.maxChunkLength as number
	};

	// Iterate the lines
	lines.forEach((line, lineIndex) => chunkLine(info, options, line, lineIndex));

	// If we have a trailing chunk, make sure we include it
	if (info.currentChunk.length > 0) {
		info.currentIndex = info.chunks.push(info.currentChunk);
	}

	return info.chunks;
}
function chunkLine(info: TChunkInfo, options: TChunkOptions, line: string, lineIndex: number): void {
	// We don't want a leading newLine
	const newLine = lineIndex > 0 ? options.newLineCharacter : "";

	// Test if the line would put the chunk over the maxChunkLength
	if (info.currentChunk.length + newLine.length + line.length < info.maxChunkLength(info.currentIndex)) {
		// If not, simply add it, including newLine since we split on that
		info.currentChunk += newLine + line;

	}else {
		// We know we are too long, so we push the current chunk and start a new one
		info.currentIndex = info.chunks.push(info.currentChunk);

		// Check to see if the line's length is shorter than maxChunkLength
		if (line.length < info.maxChunkLength(info.currentIndex)) {
			// If shorter, use it to start the new chunk
			info.currentChunk = line;

		}else {
			// The line needs to be split up, so start an empty chunk
			info.currentChunk = "";

			// Split the line into words (generally splitting on " ")
			const words = line.split(options.wordSplitter);

			// Iterate the words
			words.forEach((word, wordIndex) => chunkWord(info, options, word, wordIndex));

			// Include the last, trailing chunk
			info.currentIndex = info.chunks.push(info.currentChunk);

			// End of line, end of chunk
			info.currentChunk = "";
		}
	}
}
function chunkWord(info: TChunkInfo, options: TChunkOptions, word: string, wordIndex: number): void {
	// We don't want a leading space
	const space = wordIndex > 0 ? options.spaceCharacter : "";

	// Test if the word would put the chunk over the maxChunkLength
	if (info.currentChunk.length + space.length + word.length < info.maxChunkLength(info.currentIndex)) {
		// If not, simply add it, including the space since we split on that
		info.currentChunk += space + word;

	}else {
		// We know we are too long, so we push the current chunk and start a new one
		info.currentIndex = info.chunks.push(info.currentChunk);

		// Start the new chunk with the current word
		info.currentChunk = word;
	}
}

//#endregion

/** Reduces multiple whitespace characteres to a single space, then trims the string. */
export function cleanWhitespace(value: string): string {
	return value.replace(/\s+/g, " ").trim();
}

/** Removes first and last character if they are both quotes. */
export function dequote(value: string): string {
	return isQuoted(value) ? value.slice(1, -1) : value;
}

/** Convenience for XRegExp.escape(value). */
export function escapeForRegExp(value: string): string {
	return XRegExp.escape(value);
}

//#region .format

export function namedFormat(template: string, args: any[]): string {
	const keyMatches = template.match(/#{\w+}/g);
	if (keyMatches === null) {
		return template;
	}

	const keyRegex = /\w+/,
		keys = Array.from(keyMatches).map(key => key.match(keyRegex)?.shift());

	let result = template;
	keys.forEach(key => {
		if (key) {
			for (const obj of args) {
				if (key in obj) {
					result = result.replace(`#{${key}}`, obj[key]);
					break;
				}
			}
		}
	});
	return result;
}

export function originalFormat(template: string, args: any[]): string {
	let result = template;
	for (let i = args.length; i--;) {
		result = result.replace(XRegExp(XRegExp.escape(`{${i}}`), "g"), args[i]);
	}
	return result;
}

export function format(template: string, ...args: any[]): string {
	const regex = /#{\w+}/g;
	if (regex.test(template)) {
		return namedFormat(template, args);
	}
	return originalFormat(template, args);
}

//#endregion

//#region isBlank / isNotBlank

/** Returns true if null, undefined, or only whitespace. */
export function isBlank(text: Optional<string>): text is null | undefined | "" {
	return text === null || text === undefined || text.trim() === "";
}

/** Returns true if not null and not undefined and not only whitespace. */
export function isNotBlank(text: Optional<string>): text is string {
	return !isBlank(text);
}

//#endregion

//#region normalize

/** Converts forward/back apostrophe characters to ' */
export function normalizeApostrophes(text: string): string {
	/*// return text.replace(SINGLE_REGEX, SINGLE);*/
	return text.replace(/[\u2018\u2019]/g, `'`);
}

/** Converts m-dash and n-dash characters to - */
export function normalizeDashes(text: string): string {
	/*// const DASH = "\u002D", NDASH = "\u2013", MDASH = "\u2014";*/
	return text.replace(/[\u2013\u2014]/g, `-`);
}

/** Converts ellipses character to ... */
export function normalizeEllipses(text: string): string {
	return text.replace(/[\u2026]/g, `...`);
}

/** Converts forward/back quote characters to " */
export function normalizeQuotes(text: string): string {
	/*// return text.replace(DOUBLE_REGEX, DOUBLE);*/
	return text.replace(/[\u201C\u201D]/g, `"`);
}

/** Convenience for normalizeApostrophes(normalizeDashes(normalizeEllipses(normalizeQuotes(value)))) */
export function normalizeAscii(text: string): string {
	return normalizeApostrophes(normalizeDashes(normalizeEllipses(normalizeQuotes(text))));
}

//#endregion

/** Converts any characters within `` blocks to asterisks. Ex: "a `code` block" becomes "a `****` block" */
export function redactCodeBlocks(content: string): string {
	return content

		// reverse the string for simpler regex of escaped back-ticks
		.split("").reverse().join("")

		// replace any tick quoted blocks with empty strings
		.replace(/`.*?`(?!\\)/gi, match => `\`${match.slice(1, -1).replace(/./g, "*")}\``)

		// re-reverse the output to have the correct string; minus block quotes
		.split("").reverse().join("");
}

/** Removes accents from letters. Ex: "à" becomes "a" */
export function removeAccents(value: string): string {
	return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Returns the string source of our word character regex. */
function getWordCharSource(s: "*" | "+" | ""): string {
	return `[\\w\\pL\\pN]${s}`;
}

/** Returns the string source of our quoted value regex. */
function getQuotedSource(s: "*" | "+"): string {
	return `(?:“[^”]${s}”|„[^“]${s}“|„[^”]${s}”|"[^"]${s}")`;
}

/** Returns the string source of our key/value regex. */
function getKeyValueArgSource(key: string = getWordCharSource("+")): string {
	const value = `(?:${getQuotedSource("*")}|\\S+)`;
	return `${key}\\s*=+\\s*${value}`;
}

/** Convenience for creating/sharing quoted value regex in case we change it later. */
export function createQuotedRegex(allowEmpty: boolean): RegExp {
	return XRegExp(getQuotedSource(allowEmpty ? "*" : "+"));
}

/** Convenience for creating/sharing key=value regex in case we change it later. Passing in a key will make sure they keys match. */
export function createKeyValueArgRegex(key?: string): RegExp {
	return XRegExp(getKeyValueArgSource(key), "i");
}

/** Convenience for creating/sharing whitespace regex in case we change it later. */
export function createWhitespaceRegex(globalFlag = false): RegExp {
	return globalFlag ? /\s+/ : /\s+/g;
}

export enum DiscordEmojiRegexMatchCount { AllowEmpty = 0, SingleMatch = 1, MultipleMatches = 2 }

/** Convenience for creating/sharing regex that matches discord emoji _and_ unicode emoji. */
export function createDiscordEmojiRegex(matchCount = DiscordEmojiRegexMatchCount.SingleMatch, globalFlag = false): RegExp {
	const discordEmojiRegex = `<a?:\\w{2,}:\\d{16,}>`;
	const unicodeEmojiRegex = createEmojiRegex();
	const flags = globalFlag ? "g" : "";
	const regex = `${discordEmojiRegex}|${unicodeEmojiRegex.source}`;
	if (matchCount !== DiscordEmojiRegexMatchCount.SingleMatch) {
		const plus = matchCount === DiscordEmojiRegexMatchCount.MultipleMatches ? "+" : "";
		const star = matchCount === DiscordEmojiRegexMatchCount.AllowEmpty ? "*" : "";
		return XRegExp(`(?:${regex})${plus}${star}`, flags);
	}
	return XRegExp(regex, flags);
}

/** Returns true if the value is key=value or key="value" or key="", false otherwise. Passing in a key will make sure they keys match. */
export function isKeyValueArg(value: string, key?: string): boolean {
	const regex = XRegExp(`^${getKeyValueArgSource(key)}$`, "i");
	return value.match(regex) !== null;
}

/** Returns true if the value begins and ends in quotes, false otherwise. */
export function isQuoted(value: string): boolean {
	const regex = XRegExp(`^${getQuotedSource("*")}$`);
	return value.match(regex) !== null;
}

/** Returns [key, value, key=value] if the input is a valid key/value pairing, null otherwise */
export function parseKeyValueArg(input: string, key?: string): TKeyValueArg | null {
	if (isKeyValueArg(input, key)) {
		const index = input.indexOf("=");
		const key = input.slice(0, index);
		const keyLower = key.toLowerCase();
		const value = dequote(input.slice(index + 1).trim());
		const quoted = quote(value);
		const clean = `${keyLower}=${quoted}`;
		const simple = `${keyLower}=${value.trim()}`;
		return { key, keyLower, value, clean, simple };
	}
	return null;
}

/** Puts quotes around a value; if the value has quotes in it, it will try various fancy quotes until it won't break. */
export function quote(value: string): string {
	if (value.includes(`"`)) {
		//“[^”]${s}”|„[^“]${s}“|„[^”]${s}”|"[^"]${s}"
		if (!value.match(/[“”]/)) {
			return `“${value}”`;
		}
		if (!value.match(/[„“]/)) {
			return `„${value}“`;
		}
		if (!value.match(/[„”]/)) {
			return `„${value}”`;
		}
	}
	return `"${value}"`;
}
