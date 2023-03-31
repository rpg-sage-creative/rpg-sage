import { mkdir, mkdirSync, writeFile as fsWriteFile, writeFileSync as fsWriteFileSync } from "fs";
import { formattedStringify } from "../JsonUtils";

//#region helpers

/** Removes the filename from the end of the given path. */
function toFilePath(filePathAndName: string): string {
	return filePathAndName.split(/\//).slice(0, -1).join("/");
}

/**
 * Ensures we have content that can be written to file.
 * Buffers and strings are passed on, an Object is converted using JSON.stringify or formattedStringify.
 */
function contentToFileOutput<T>(content: T, formatted?: boolean): string | Buffer {
	if (Buffer.isBuffer(content)) {
		return content;
	}
	if (typeof(content) === "string") {
		return content;
	}
	return formatted
		? formattedStringify(content)
		: JSON.stringify(content);
}

//#endregion

//#region writeFile

function write<T>(filePathAndName: string, content: T, formatted?: boolean): Promise<boolean> {
	return new Promise((resolve, reject) => {
		fsWriteFile(filePathAndName, contentToFileOutput(content, formatted), error => {
			if (error) {
				reject(error);
			}else {
				resolve(true);
			}
		});
	});

}

/** Writes the given content to the given file path/name. */
export function writeFile<T>(filePathAndName: string, content: T): Promise<boolean>;
/** Writes the given content to the given file path/name, optionally building the path if it doesn't exist. */
export function writeFile<T>(filePathAndName: string, content: T, mkdir: boolean): Promise<boolean>;
/** Writes the given content to the given file path/name, optionally building the path if it doesn't exist, optionally formatting JSON output. */
export function writeFile<T>(filePathAndName: string, content: T, mkdir: boolean, formatted: boolean): Promise<boolean>;
export function writeFile<T>(filePathAndName: string, content: T, makeDir?: boolean, formatted?: boolean): Promise<boolean> {
	return new Promise((resolve, reject) => {
		if (makeDir) {
			mkdir(toFilePath(filePathAndName), { recursive:true }, error => {
				if (error) {
					reject(error);
				}else {
					write(filePathAndName, content, formatted).then(resolve, reject);
				}
			});
		}else {
			write(filePathAndName, content, formatted).then(resolve, reject);
		}
	});
}

//#endregion

//#region writeFileSync

/** Writes the given content to the given file path/name. */
export function writeFileSync<T>(filePathAndName: string, content: T): boolean;
/** Writes the given content to the given file path/name, optionally building the path if it doesn't exist. */
export function writeFileSync<T>(filePathAndName: string, content: T, mkdir: boolean): boolean;
/** Writes the given content to the given file path/name, optionally building the path if it doesn't exist, optionally formatting JSON output. */
export function writeFileSync<T>(filePathAndName: string, content: T, mkdir: boolean, formatted: boolean): boolean;
export function writeFileSync<T>(filePathAndName: string, content: T, makeDir?: boolean, formatted?: boolean): boolean {
	try {
		if (makeDir) {
			mkdirSync(toFilePath(filePathAndName), { recursive:true });
		}
	} catch(ex) {
		console.error(ex);
	}
	try {
		fsWriteFileSync(filePathAndName, contentToFileOutput(content, formatted));
	} catch(ex) {
		console.error(ex);
		return false;
	}
	return true;
}

//#endregion
