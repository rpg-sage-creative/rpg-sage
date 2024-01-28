import { listFiles } from "./listFiles";

/**
 * Lists all the file paths that exist in the given path and *pass* the filter given.
 * @returns Array of file paths (not just file names).
 */
export async function filterFiles(path: string, filter: (fileName: string, filePath: string) => boolean): Promise<string[]>;

/**
 * Lists all the file paths that exist in the given path (recursively) and *pass* the filter given.
 * @returns Array of file paths (not just file names).
 */
export async function filterFiles(path: string, filter: (fileName: string, filePath: string) => boolean, recursive: true): Promise<string[]>;

export async function filterFiles(path: string, filter: (fileName: string, filePath: string) => boolean, recursive = false): Promise<string[]> {
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
