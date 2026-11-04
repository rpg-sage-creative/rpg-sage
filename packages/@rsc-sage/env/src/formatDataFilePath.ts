import { format } from "node:path";
import { getDataRoot } from "./getDataRoot.js";

type Options = {
	/** the path passed into getDataRoot(); ensured by getDataRoot() */
	dir: string | string[];

	/** the child path appended after getDataRoot(dataPath); NOT ensured by getDataRoot() */
	subDir?: string | string[];

	/** the file name and extension */
	base: string;

	/** the file name */
	name?: never;

	/** an optional file extension to append if base doesn't include one; DEFAULT: "json" */
	ext?: never;
} | {
	/** the path passed into getDataRoot(); ensured by getDataRoot() */
	dir: string | string[];

	/** the child path appended after getDataRoot(dataPath); NOT ensured by getDataRoot() */
	subDir?: string | string[];

	/** the file name and extension */
	base?: never;

	/** the file name */
	name: string;

	/** an optional file extension to append if base doesn't include one; DEFAULT: "json" */
	ext?: string;
};

/**
 * Creates a filePath for the given fileName by using path.join(), getDataRoot(), and path.format().
 * If fileName does not include an extension, then ".json" will be added.
 * Convenience for: format({ dir:getDataRoot(join(dataPath)), name:fileName, ext:"json" )})
 * @param dataPath a string or array representing the path given to getDataRoot
 * @param fileName passed as "name" to format
 */
export function formatDataFilePath(dataPath: string | string[], fileName: string): string;

/**
 * Creates a filePath for the given fileName by using path.join(), getDataRoot(), and path.format().
 * Convenience for: format({ dir:getDataRoot(join(dataPath)), name:fileName, ext:fileExt )})
 * @param dataPath a string or array representing the path given to getDataRoot
 * @param fileName passed as "name" to format
 * @param fileExt passed as "ext" to format
 */
export function formatDataFilePath(dataPath: string | string[], fileName: string, fileExt: string): string;

/**
 * Creates a filePath for the given fileName by using path.join(), getDataRoot(), and path.format().
 * Convenience for: format({ dir:join(getDataRoot(join(options.dataPath)), options.childPath), name:options.fileName, ext:options.fileExt )})
 */
export function formatDataFilePath(options: Options): string;

export function formatDataFilePath(arg: string | string[] | Options, name?: string, ext?: string): string {
	let dataPath: string | string[] | undefined;
	let childPath: string | string[] | undefined;
	let base: string | undefined;

	if (typeof(arg) === "string" || Array.isArray(arg)) {
		dataPath = arg;

	}else {
		({ dir:dataPath, subDir:childPath, base, name, ext } = arg);
	}

	// rootPath gets ensured by getDataRoot
	const dir = getDataRoot(dataPath, childPath);

	// set default ext to json
	if (!name?.endsWith(".json")) {
		ext ??= "json";
	}

	return format({ dir, base, name, ext });
}
