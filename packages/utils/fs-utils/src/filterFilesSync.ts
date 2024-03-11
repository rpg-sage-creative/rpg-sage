import { listFilesSync } from "./listFilesSync.js";

/**
 * Lists all the file paths that exist in the given path (optionally recursively) and *pass* the filter given.
 * @returns Array of file paths (not just file names).
 */
export function filterFilesSync(path: string, filter: (fileName: string, filePath: string) => boolean, recursive?: boolean): string[] {
	const output: string[] = [];
	const files = listFilesSync(path);
	for (const fileName of files) {
		const filePath = `${path}/${fileName}`;
		const result = filter(fileName, filePath);
		if (result) {
			output.push(filePath);
		}
		if (recursive) {
			output.push(...filterFilesSync(filePath, filter, true));
		}
	}
	return output;
}
