import { errorReturnUndefined, type Optional } from "@rsc-utils/core-utils";
import { getText, parseDsv, type DsvDelimiter, type DsvResults, type VALID_URL } from "@rsc-utils/io-utils";
import type { SageCommand } from "../SageCommand.js";

type StringRecord = Record<string, string>;

export async function parseFormattedDsv<T extends StringRecord>(raw: Optional<string>, separator: DsvDelimiter = "\t"): Promise<DsvResults<T> | undefined> {
	if (raw) {
		const mapHeaders = ({ header }: { header:string; }) => {
			return header.split(/\s+/).map((s, i) =>
				i ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s.toLowerCase()
			).join("");
		}
		const mapValues = ({ value }: { value:string; }) => value.trim();
		return parseDsv(raw, { separator, mapHeaders, mapValues });
	}
	return undefined;
}

/** Fetches tsv from the given (valid) url and returns keys and lines. */
export async function fetchAndParseDsv<T extends StringRecord>(url: VALID_URL, separator?: DsvDelimiter): Promise<DsvResults<T> | undefined> {
	const raw = await getText(url).catch(errorReturnUndefined);
	return parseFormattedDsv(raw, separator);
}

type KeyedDsvResults<T extends StringRecord> = DsvResults<T> & { key:string; };
export async function fetchAndParseAllDsv<T extends StringRecord>(sageCommand: SageCommand): Promise<KeyedDsvResults<T>[]> {
	const results: KeyedDsvResults<T>[] = [];

	const pairs = [
		{ key:"tsv", delim:"\t" },
		{ key:"csv", delim:"," },
		{ key:"psv", delim:"|" },
		{ key:"dsv" },
		{ key:"file" },
		{ key:"url" },
	];

	for (const { key, delim } of pairs) {
		const url = sageCommand.args.getUrl(key) ?? undefined;
		if (url) {
			const dsvResults = await fetchAndParseDsv<T>(url, delim as DsvDelimiter);
			if (dsvResults) results.push({ key, ...dsvResults });
		}
	}

	if (sageCommand.isSageMessage()) {
		for (const [_, att] of sageCommand.message.attachments) {
			if (att.contentType?.includes("text")) {
				const pair = pairs.find(({ key }) => att.url.includes(`.${key}`));
				if (pair) {
					const dsvResults = await fetchAndParseDsv<T>(att.url as VALID_URL, pair?.delim as DsvDelimiter);
					if (dsvResults) results.push({ key:pair.key, ...dsvResults });
				}
			}
		}
	}

	return results;
}

// export async function fetchAndParseMacros(url: VALID_URL, separator?: DsvDelimiter): Promise<MacroBase[]> {
// 	const results = await fetchAndParseDsv(url, separator);
// 	if (!results?.items.length) return [];

// 	const macros: MacroBase[] = [];
// 	for (const item of results.items) {
// 		if (item.name && item.dice && isWrapped(item.dice, "[]")) {
// 			macros.push({ name:item.name, category:stringOrUndefined(item.category), dice:item.dice });
// 		}
// 	}
// 	return macros;
// }