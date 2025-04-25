import { rm } from "fs";
import { fileExists } from "./fileExists.js";

/**
 * Convenience wrapper for fs.rm(path, { force }) that resolves to boolean.
 * Resolves true if rm completes successfully.
 * Resolves false if no errors were thrown and rm didn't complete successfully.
 * Errors are bubbled via rejection to be handled with .catch()
 */
export function deleteFile(path: string, options?: { force?:boolean; }): Promise<boolean>;

/**
 * Convenience wrapper for fs.rm(path, { force }) that resolves to truthy/falsey.
 * Resolves "NotFound" if the file is checked before deleting and didn't exist (counts as truthy for if the file was deleted).
 * Resolves true if rm completes successfully and it isn't checked after or it is checked after and not found.
 * Returns false if rm completes successfully and the file is checked after and still exists.
 * Errors are bubbled via rejection to be handled with .catch()
 */
export function deleteFile(path: string, options: { checkExists:true; force?:boolean; }): Promise<"NotFound" | boolean>;

export function deleteFile(path: string, options?: { checkExists?:true | "before" | "after"; force?:boolean; }): Promise<"NotFound" | boolean> {
	return new Promise<"NotFound" | boolean>(async (resolve, reject) => {
		const checkExists = options?.checkExists ?? false;

		const checkBefore = checkExists === true || checkExists === "before";
		if (checkBefore) {
			const exists = await fileExists(path).catch(reject);

			// no file means exit early
			if (!exists) {
				// we resolve "NotFound"
				if (exists === false) resolve("NotFound"); // NOSONAR
				// exit early (we rejected fileExists)
				return;
			}
		}

		// allow force to be passed in, default to true
		const force = options?.force ?? true;

		// attempt to delete
		const deleted = await new Promise<boolean>((res, rej) =>
			rm(path, { force }, err => err ? rej(err) : res(true))
		).catch(reject);

		// we failed to delete (and already rejected), no need to look for file
		if (deleted !== true) {
			return;
		}

		// check again to be sure
		const checkAfter = checkExists === true || checkExists === "after";
		if (checkAfter) {
			const exists = await fileExists(path).catch(reject);
			// let's resolve if we didn't already reject
			if (exists !== undefined) {
				resolve(!exists);
			}
			return;
		}

		// assume all went well
		resolve(deleted);
	});
}
