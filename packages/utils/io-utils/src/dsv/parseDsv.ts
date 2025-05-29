import csvParser from "csv-parser";
import { Readable as ReadableStream, Transform } from "node:stream";

type ParserInput = string | Buffer;
export type DsvDelimiter = "," | "|" | "\t";

type StringRecord = Record<string, string>;
export type DsvResults<T extends StringRecord> = { keys:string[]; items:T[]; delimiter:DsvDelimiter; };

function withResolvers<T>(input: ParserInput, parserOptions?: csvParser.Options) {
	const { promise, resolve, reject } = Promise.withResolvers<T>();
	let stream: ReadableStream | undefined = ReadableStream.from(input);
	let parser: csvParser.CsvParser | undefined = csvParser(parserOptions);
	let pipe: Transform | undefined;
	const destroy = () => {
		stream?.destroy();
		stream = undefined;
		parser?.destroy();
		parser = undefined;
		pipe?.destroy();
		pipe = undefined;
	};
	const res = (value: T) => {
		destroy();
		resolve(value);
	};
	const rej = (err: unknown) => {
		destroy();
		reject(err);
	};
	pipe = stream
		.pipe(parser)
		.once("error", rej)
		.once("close", res);
	return { pipe, promise, resolve:res, reject:rej };
}

async function detectSeparator(input: ParserInput): Promise<string | undefined> {
	const { pipe, promise, resolve } = withResolvers<string | undefined>(input);
	pipe.once("headers", headers => {
		if (headers.length > 1) return resolve(",");
		if (headers.length === 1) {
			const match = /([^\w "])/.exec(headers[0]);
			if (match) return resolve(match[0]);
		}
		return resolve(undefined);
	});
	return promise;
}

export async function parseDsv<T extends StringRecord>(input: ParserInput, opts?: csvParser.Options | DsvDelimiter): Promise<DsvResults<T> | undefined> {
	if (typeof(input) !== "string" && !Buffer.isBuffer(input)) {
		throw new RangeError(`Invalid Data: parseDsv(${input})`);
	}

	let parserOptions: { separator?:string; } | undefined = opts ? typeof(opts) === "string" ? { separator:opts } : opts : { };
	if (!parserOptions?.separator) {
		const separator = await detectSeparator(input);
		if (separator) {
			if (!parserOptions) parserOptions = { };
			parserOptions.separator = separator;
		}
	}

	const { pipe, promise } = withResolvers<T[]>(input, parserOptions);

	const keys: string[] = [];
	const items: T[] = [];
	const delimiter = parserOptions.separator as DsvDelimiter ?? ",";

	pipe.on("headers", (headers: string[]) => keys.push(...headers));
	pipe.on("data", (data: T) => items.push(data));
	await promise;

	if (keys.length <= 1) return undefined;

	return { keys, items, delimiter };
}