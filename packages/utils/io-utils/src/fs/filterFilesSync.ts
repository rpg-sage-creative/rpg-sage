import { createExtFilter } from "./internal/createExtFilter.js";
import { isDirSync } from "./isDirSync.js";
import { listFilesSync } from "./listFilesSync.js";

type DirFilterFn = (dirName: string, dirPath: string) => boolean;
type FileFilterFn = (fileName: string, filePath: string) => boolean;

type DirOptions = {
	dirFilter?: DirFilterFn;
	recursive?: boolean;
};

type FileOptions = {
	fileExt: string;
	fileFilter: FileFilterFn;
} | {
	fileExt: string;
	fileFilter?: never;
} | {
	fileExt?: never;
	fileFilter: FileFilterFn;
};

type Options = DirOptions & FileOptions;

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
	throw Error("filterFilesSync must ge given a fileExt or fileFilter");
}

/**
 * @deprecated use filterFilesSync(path: string, options: Options)
 * Lists all the file paths that exist in the given path (optionally recursively) and *pass* the filter given.
 * @returns Array of file paths (not just file names).
 */
export function filterFilesSync(path: string, filter: FileFilterFn, recursive?: boolean): string[];

/**
 * @deprecated use filterFilesSync(path: string, options: Options)
 * Lists all the file paths that exist in the given path (optionally recursively) with the given extension.
 * @returns Array of file paths (not just file names).
 */
export function filterFilesSync(path: string, ext: string, recursive?: boolean): string[];

/**
 * Lists all the file paths that exist in the given path (optionally recursively) with that match the given extension and/or filter.
 * @returns Array of file paths (not just file names).
 */
export function filterFilesSync(path: string, options: Options): string[];

export function filterFilesSync(path: string, extOrFilterOrOpts: string | FileFilterFn | Options, _recursive?: boolean): string[] {
	const output: string[] = [];

	const options = createOptions(extOrFilterOrOpts, _recursive);
	const filter = createFileFilter(options);

	const files = listFilesSync(path);
	for (const fileName of files) {
		const filePath = `${path}/${fileName}`;

		// check to see if this is a directory
		if (isDirSync(filePath)) {
			// only process it if recursive
			if (options.recursive) {
				// process if no dirFilter or if dirFilter returns truthy
				if (options.dirFilter ? options.dirFilter(fileName, filePath) : true) {
					const children = filterFilesSync(filePath, options);
					children.forEach(child => output.push(child));
				}
			}

		// run this file through the filter
		}else if (filter(fileName, filePath)) {
			output.push(filePath);
		}
	}
	return output;
}
