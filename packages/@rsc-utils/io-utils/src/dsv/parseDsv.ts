import type { TypedRegExp } from "@rsc-utils/core-utils";
import csvParser from "csv-parser";
import { Readable as ReadableStream, Transform } from "node:stream";

/** DSV parsing expects either a string or Buffer. */
type ParserInput = string | Buffer;

/** DSV parsing expects a delimiter to be one of these values. */
export type DsvDelimiter = "," | "|" | "\t";

/** A Record restricted to string keys and values. */
type StringRecord = Record<string, string>;

export type DsvResults<
	Item extends StringRecord
> = {
	/** the item keys from the header row */
	keys: string[];
	/** the data rows as Item objects */
	items: Item[];
	/** the delimiter used in the file */
	delimiter: DsvDelimiter;
};

/**
 * A custom expansion of Promise.withResolvers() that wires up the stream to a parser and returns the pipe along with the promise/resolve/reject functions.
 * By handling the wiring of the stream in here we can reuse this logic while ensuring objects get torn down properly.
 * @param input the content to be parsed
 * @param parserOptions csv-parser options to be passed through to csvParser()
 * @returns the underlying promise along with wrapped resolve/reject functions and a wired up pipe object
 */
function withResolvers<
	Item,
>(
	input: ParserInput,
	parserOptions?: csvParser.Options,
) {

	// get the underlying promise and resolve/reject handlers
	const {
		promise,
		resolve: _resolve,
		reject: _reject
	} = Promise.withResolvers<Item>();

	// declare variables used in teardown (destroy)
	let stream: ReadableStream | undefined = ReadableStream.from(input);
	let parser: csvParser.CsvParser | undefined = csvParser(parserOptions);
	let pipe: Transform | undefined;

	// reusable teardown logic for both resolve and reject
	const destroy = () => {
		stream?.destroy();
		stream = undefined;
		parser?.destroy();
		parser = undefined;
		pipe?.destroy();
		pipe = undefined;
	};

	// wrappers for resolve/reject that perform teardown via destroy()
	const resolve = (value: Item) => {
		destroy();
		_resolve(value);
	};
	const reject = (err: unknown) => {
		destroy();
		_reject(err);
	};

	// wireup the stream and parser and catch all reject/resolve
	pipe = stream
		.pipe(parser)
		.once("error", reject)
		.once("close", resolve);

	// return expanded resolvers
	return {
		pipe,
		promise,
		resolve,
		reject
	};
}

/** Reusable Delimiter detection RegExp. */
const DelimiterRegExp = (/(?<delim>[^\w "])/) as TypedRegExp<{ delim:string; }>;

/**
 * Used to detect the delimiter by reading the headers.
 * Headers should be simple text-only keys, so this should work 99% of the time.
 * @param input the content to be parsed
 * @returns the character used as the delimiter for the data
 */
async function detectSeparator(
	input: ParserInput,
): Promise<string | undefined> {
	// create the pipe and resolvers
	const { pipe, promise, resolve } = withResolvers<string | undefined>(input);

	// we only check the headers
	pipe.once("headers", headers => {
		// default parser is comma, if we have multiple columns then that's our answer
		if (headers.length > 1) return resolve(",");

		// data with a single column means no commas
		if (headers.length === 1) {
			// find the first char that isn't used for a header as the delimiter
			const match = DelimiterRegExp.exec(headers[0]);
			if (match) {
				// we have the delimiter, send it
				return resolve(match.groups.delim);
			}
		}
		// we are done, resolving destroys the stream and parser
		return resolve(undefined);
	});

	// pass the promise out
	return promise;
}

/**
 * Reads the given input and parses the rows into json objects using the header row as keys.
 * @param input the content to be parsed
 * @param opts can be full csv-parser options or simply a delimiter
 * @returns results of parsing the data or undefined if there is no data or only one column is returned.
 */
export async function parseDsv<
	T extends StringRecord,
>(
	input: ParserInput,
	opts?: csvParser.Options | DsvDelimiter,
): Promise<DsvResults<T> | undefined> {

	// require a valid input value
	if (typeof(input) !== "string" && !Buffer.isBuffer(input)) {
		throw new RangeError(`Invalid Data: parseDsv(${input})`);
	}

	// create parser options from given opts
	let parserOptions: { separator?:string; } = { };
	if (opts) {
		parserOptions = typeof(opts) === "string"
			? { separator:opts }
			: opts;
	}

	// if we don't have a delimiter/separator, detect one
	if (!parserOptions?.separator) {
		parserOptions.separator = await detectSeparator(input);
	}

	// create return values
	const keys: string[] = [];
	const items: T[] = [];
	const delimiter = parserOptions.separator as DsvDelimiter ?? ",";

	// writeup pipe
	const { pipe, promise } = withResolvers<T[]>(input, parserOptions);
	pipe.on("headers", (headers: string[]) => headers.forEach(key => keys.push(key)));
	pipe.on("data", (data: T) => items.push(data));

	// await processing
	await promise;

	// single or no columns aren't valid for our purpose
	if (keys.length <= 1) {
		return undefined;
	}

	// return results
	return { keys, items, delimiter };
}