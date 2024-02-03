import { isPromise } from "util/types";
import { listFiles } from "./listFiles.js";

/**
 * Lists all the file paths that exist in the given path (optionally recursively) and *pass* the filter given.
 * @returns Array of file paths (not just file names).
 */
export async function filterFiles(path: string, filter: (fileName: string, filePath: string) => boolean | PromiseLike<boolean>, recursive?: boolean): Promise<string[]> {
	const output: string[] = [];
	const files = await listFiles(path).catch(() => []);
	for (const fileName of files) {
		const filePath = `${path}/${fileName}`;
		const promise = filter(fileName, filePath);
		const result = isPromise(promise) ? await promise : promise;
		if (result) {
			output.push(filePath);
		}
		if (recursive) {
			output.push(...(await filterFiles(filePath, filter, true)));
		}
	}
	return output;
}
