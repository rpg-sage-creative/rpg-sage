import { createExtFilter } from "./internal/createExtFilter.js";
import { listFilesSync } from "./listFilesSync.js";

type FilterFn = (fileName: string, filePath: string) => boolean;

/**
 * Lists all the file paths that exist in the given path (optionally recursively) and *pass* the filter given.
 * @returns Array of file paths (not just file names).
 */
export function filterFilesSync(path: string, filter: FilterFn, recursive?: boolean): string[];

export function filterFilesSync(path: string, ext: string, recursive?: boolean): string[];

export function filterFilesSync(path: string, extOrFilter: string | FilterFn, recursive?: boolean): string[] {
	const output: string[] = [];
	const filter = typeof(extOrFilter) === "function" ? extOrFilter : createExtFilter(extOrFilter);
	const files = listFilesSync(path);
	for (const fileName of files) {
		const filePath = `${path}/${fileName}`;
		const result = filter(fileName, filePath);
		if (result) {
			output.push(filePath);
		}
		if (recursive) {
			output.push(...filterFilesSync(filePath, filter, true));
		}
	}
	return output;
}
