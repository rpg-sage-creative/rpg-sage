import { writeFileSync as fsWriteFileSync, mkdirSync } from "fs";
import { contentToFileOutput } from "./helpers/contentToFileOutput";
import { toFilePath } from "./helpers/toFilePath";

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