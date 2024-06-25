import type { Awaitable } from "@rsc-utils/core-utils";
import { isPromise } from "util/types";
import { createExtFilter } from "./internal/createExtFilter.js";
import { listFiles } from "./listFiles.js";

type FilterFn = (fileName: string, filePath: string) => Awaitable<boolean>;

/**
 * Lists all the file paths that exist in the given path (optionally recursively) and *pass* the filter given.
 * @returns Array of file paths (not just file names).
 */
export async function filterFiles(path: string, filter: FilterFn, recursive?: boolean): Promise<string[]>;

/**
 * Lists all the file paths that exist in the given path (optionally recursively) with the given extension.
 * @returns Array of file paths (not just file names).
 */
export async function filterFiles(path: string, ext: string, recursive?: boolean): Promise<string[]>;

export async function filterFiles(path: string, extOrFilter: string | FilterFn, recursive?: boolean): Promise<string[]> {
	const output: string[] = [];
	const filter = typeof(extOrFilter) === "function" ? extOrFilter : createExtFilter(extOrFilter);
	const files = await listFiles(path).catch(() => []);
	for (const fileName of files) {
		const filePath = `${path}/${fileName}`;
		const promise = filter(fileName, filePath);
		const result = isPromise(promise) ? await promise : promise;
		if (result) {
			output.push(filePath);
		}
		if (recursive) {
			output.push(...(await filterFiles(filePath, filter, true)));
		}
	}
	return output;
}
