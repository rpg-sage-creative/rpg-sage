import { isDefined, type Awaitable } from "@rsc-utils/core-utils";
import { filterFiles } from "./filterFiles.js";
import { readJsonFile } from "./readJsonFile.js";

type ContentFilterFn<T> = (json: T) => Awaitable<boolean>;
type DirFilterFn = (dirName: string, dirPath: string) => Awaitable<boolean>;
type FileFilterFn = (fileName: string, filePath: string) => Awaitable<boolean>;

type Options<T> = {
	contentFilter: ContentFilterFn<T>;
	dirFilter?: DirFilterFn;
	fileExt?: string;
	fileFilter?: FileFilterFn;
	recursive?: boolean;
};

/**
 * Returns the first json that matches the given contentFilter.
 * This uses filterFiles to narrow down the files before opening them.
 */
export async function findJsonFile<T>(path: string, options: Options<T>): Promise<T | undefined> {
	// if no file extension/filter was given, this will ensure the files end with .json
	if (!options.fileExt && !options.fileFilter) {
		options.fileExt = "json";
	}

	const files = await filterFiles(path, options as { fileExt:string; });
	if (files.length === 0) return undefined;

	// if no content filter was given, this will still ensure the object is defined
	const contentFilter = options.contentFilter
		? async (json: T) => isDefined(json) ? options.contentFilter!(json) : false
		: isDefined;

	for (const file of files) {
		const json = await readJsonFile<T>(file);
		// contentFilter uses isDefined internally so we can safely cast as T
		if (await contentFilter(json as T)) {
			return json as T;
		}
	}

	return undefined;
}
