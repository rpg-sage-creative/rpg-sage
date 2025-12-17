import { errorReturnNull, type Optional } from "@rsc-utils/core-utils";
import { getText, type VALID_URL } from "@rsc-utils/io-utils";
import { isWrapped, stringOrUndefined } from "@rsc-utils/core-utils";
import type { MacroBase } from "../Macro.js";

type StringRecord = Record<string, string>;
type Results<T extends StringRecord> = { keys:string[]; items:T[]; };

export function parseTsv<T extends Record<string, string>>(raw: Optional<string>): Results<T> | undefined {
	if (raw) {
		const lines = raw.split(/[\n\r]+/).filter(s => s.trim()).map(line => line.split(/\t/).map(val => val.trim()));
		if (!lines.length) return undefined;

		const keys = lines.shift() ?? [];
		if (!keys.length) return undefined;

		const items: T[] = [];
		lines.forEach(line => {
			const map = new Map<string, string | undefined>();
			keys.forEach((key, index) => map.set(key, stringOrUndefined(line[index])));
			items.push(Object.fromEntries(map) as T);
		});

		return { keys, items };
	}
	return undefined;
}

/** Fetches tsv from the given (valid) url and returns keys and lines. */
export async function fetchTsv<T extends Record<string, string>>(url: VALID_URL): Promise<Results<T> | undefined> {
	const raw = await getText(url).catch(errorReturnNull);
	return parseTsv(raw);
}

export async function fetchTsvMacros(url: VALID_URL): Promise<MacroBase[]> {
	const results = await fetchTsv(url);
	if (!results?.items.length) return [];

	const macros: MacroBase[] = [];
	for (const item of results.items) {
		if (item.name && item.dice && isWrapped(item.dice, "[]")) {
			macros.push({ name:item.name, category:stringOrUndefined(item.category), dice:item.dice });
		}
	}
	return macros;
}