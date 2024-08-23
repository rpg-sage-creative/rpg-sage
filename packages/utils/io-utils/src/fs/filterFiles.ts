import type { Awaitable } from "@rsc-utils/core-utils";
import { createExtFilter } from "./internal/createExtFilter.js";
import { isDir } from "./isDir.js";
import { listFiles } from "./listFiles.js";

type DirFilterFn = (dirName: string, dirPath: string) => Awaitable<boolean>;
type FileFilterFn = (fileName: string, filePath: string) => Awaitable<boolean>;

type BothOptions = {
	fileExt: string;
	fileFilter: FileFilterFn;
};
type ExtOptions = {
	fileExt: string;
	fileFilter?: FileFilterFn;
};
type FilterOptions = {
	fileExt?: string;
	fileFilter: FileFilterFn;
};

type Options = { dirFilter?:DirFilterFn; recursive?: boolean; }
	& (BothOptions | ExtOptions | FilterOptions);

function createOptions(input: string | FileFilterFn | Options, recursive?: boolean): Options {
	switch(typeof(input)) {
		case "string": return { fileExt:input, recursive };
		case "function": return { fileFilter:input, recursive };
		default: return input;
	}
}

/** Combines given fileExt and fileFilter or simply returns createExtFilter("json") */
function createFileFilter(options: Options): FileFilterFn {
	if (options) {
		const { fileExt, fileFilter } = options;
		if (fileExt) {
			const extFilter = createExtFilter(fileExt);
			if (fileFilter) {
				return (fileName: string, filePath: string) => extFilter(fileName) && fileFilter(fileName, filePath);
			}
			return extFilter;

		}else if (fileFilter) {
			return fileFilter;
		}
	}
	throw Error("filterFiles must ge given a fileExt or fileFilter");
}

/**
 * @deprecated use filterFiles(path: string, options: Options)
 * Lists all the file paths that exist in the given path (optionally recursively) and *pass* the filter given.
 * @returns Array of file paths (not just file names).
 */
export async function filterFiles(path: string, filter: FileFilterFn, recursive?: boolean): Promise<string[]>;

/**
 * @deprecated use filterFiles(path: string, options: Options)
 * Lists all the file paths that exist in the given path (optionally recursively) with the given extension.
 * @returns Array of file paths (not just file names).
 */
export async function filterFiles(path: string, ext: string, recursive?: boolean): Promise<string[]>;

/**
 * Lists all the file paths that exist in the given path (optionally recursively) with that match the given extension and/or filter.
 * @returns Array of file paths (not just file names).
 */
export async function filterFiles(path: string, options: Options): Promise<string[]>;

export async function filterFiles(path: string, extOrFilterOrOpts: string | FileFilterFn | Options, _recursive?: boolean): Promise<string[]> {
	const output: string[] = [];

	const options = createOptions(extOrFilterOrOpts, _recursive);
	const filter = createFileFilter(options);

	const files = await listFiles(path).catch(() => []);
	for (const fileName of files) {
		const filePath = `${path}/${fileName}`;

		// check to see if this is a directory
		if (await isDir(filePath)) {
			// only process it if recursive
			if (options.recursive) {
				// process if no dirFilter or if dirFilter returns truthy
				if (options.dirFilter ? await options.dirFilter(fileName, filePath) : true) {
					output.push(...(await filterFiles(filePath, options)));
				}
			}

		// run this file through the filter
		}else if (await filter(fileName, filePath)) {
			output.push(filePath);
		}
	}
	return output;
}
