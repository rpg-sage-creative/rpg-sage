import { readdir } from "fs";

/**
 * Lists all the filenames found in the given path.
 */
export function listFiles(path: string): Promise<string[]>;

/**
 * Lists all the filenames found in the given path that have the given extension.
 */
export function listFiles(path: string, ext: string): Promise<string[]>;

export function listFiles(path: string, ext?: string): Promise<string[]> {
	return new Promise((resolve, reject) => {
		readdir(path, (error: NodeJS.ErrnoException | null, files: string[]) => {
			if (error) {
				reject(error);
			}else {
				if (ext) {
					const regex = new RegExp(`\\.${ext}$`, "i");
					resolve(files.filter(file => file.match(regex)));
				}else {
					resolve(files);
				}
			}
		});
	});
}
