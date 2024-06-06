import { error } from "@rsc-utils/core-utils";
import { readdirSync } from "fs";

/**
 * Lists all the filenames found in the given path.
 */
export function listFilesSync(path: string): string[];

/**
 * Lists all the filenames found in the given path that have the given extension.
 */
export function listFilesSync(path: string, ext: string): string[];

export function listFilesSync(path: string, ext?: string): string[] {
	try {
		const files = readdirSync(path);
		if (ext) {
			const regex = new RegExp(`\\.${ext}$`, "i");
			return files.filter(file => file.match(regex));
		}
		return files;
	}catch(ex) {
		error(ex);
	}
	return [];
}
