import { readdir, readdirSync } from "fs";

//#region listFiles

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

//#endregion

//#region filterFiles

type TFileFilter = (fileName: string, filePath: string) => boolean;

/**
 * Lists all the file paths that exist in the given path and *pass* the filter given.
 * @returns Array of file paths (not just file names).
 */
export async function filterFiles(path: string, filter: TFileFilter): Promise<string[]>;
/**
 * Lists all the file paths that exist in the given path (recursively) and *pass* the filter given.
 * @returns Array of file paths (not just file names).
 */
export async function filterFiles(path: string, filter: TFileFilter, recursive: true): Promise<string[]>;
export async function filterFiles(path: string, filter: TFileFilter, recursive = false): Promise<string[]> {
	const output: string[] = [];
	const files = await listFiles(path).catch(() => []);
	for (const fileName of files) {
		const filePath = `${path}/${fileName}`;
		if (filter(fileName, filePath)) {
			output.push(filePath);
		}else if (recursive) {
			output.push(...(await filterFiles(filePath, filter, true)));
		}
	}
	return output;
}

//#endregion

//#region listFilesSync

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
		console.error(ex);
	}
	return [];
}

//#endregion
