import { isDefined, type Awaitable } from "@rsc-utils/core-utils";
import { filterFilesSync } from "./filterFilesSync.js";
import { readJsonFileSync } from "./readJsonFileSync.js";

type ContentFilterFn<T> = (json: T) => Awaitable<boolean>;
type DirFilterFn = (dirName: string, dirPath: string) => Awaitable<boolean>;
type FileFilterFn = (fileName: string, filePath: string) => Awaitable<boolean>;

type Options<T> = {
	contentFilter?: ContentFilterFn<T>;
	dirFilter?: DirFilterFn;
	fileExt?: string;
	fileFilter?: FileFilterFn;
	recursive?: boolean;
};

/**
 * This uses filterFiles to narrow down the files before opening them.
 * If a contentFilter is given, then the opened files are filtered using it.
 */
export function readJsonFilesSync<T>(path: string, options: Options<T> = { }): T[] {
	// if no file extension/filter was given, this will ensure the files end with .json
	if (!options.fileExt && !options.fileFilter) {
		options.fileExt = "json";
	}

	const files = filterFilesSync(path, options as { fileExt:string; });
	if (files.length === 0) {
		return [];
	}

	const out: T[] = [];

	// if no content filter was given, this will still ensure the object is defined
	const contentFilter = options.contentFilter
		? async (json: T) => isDefined(json) ? options.contentFilter!(json) : false
		: isDefined;

	for (const file of files) {
		const json = readJsonFileSync<T>(file);
		// contentFilter uses isDefined internally so we can safely cast as T
		if (contentFilter(json as T)) {
			out.push(json as T);
		}
	}

	return out;
}
