import { readdir } from "node:fs";
import { createExtFilter } from "./internal/createExtFilter.js";

/**
 * Lists all the filenames found in the given path, filtered by extension if given.
 */
export function listFiles(path: string, ext?: string): Promise<string[]> {
	return new Promise((resolve, reject) => {
		readdir(path, (error: NodeJS.ErrnoException | null, files: string[]) => {
			if (error) {
				reject(error);
			}else if (ext) {
				resolve(files.filter(createExtFilter(ext)));
			}else {
				resolve(files);
			}
		});
	});
}
