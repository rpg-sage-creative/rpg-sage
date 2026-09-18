import { rmSync } from "node:fs";
import { fileExistsSync } from "./fileExistsSync.js";

/**
 * Convenience wrapper for fs.rmSync(path, { force:true }) that resolves to boolean.
 * Resolves true if rmSync completes successfully.
 * Resolves false if no errors were thrown and rmSync didn't complete successfully.
 * Errors are not captured and expected to be handled.
 */
export function deleteFileSync(path: string, options?: { force?:boolean; }): boolean;

/**
 * Convenience wrapper for fs.rmSync(path, { force:true }) that resolves to truthy/falsey.
 * Resolves "NotFound" if the file is checked before deleting and didn't exist (counts as truthy for if the file was deleted).
 * Resolves true if rmSync completes successfully and it isn't checked after or it is checked after and not found.
 * Returns false if rmSync completes successfully and the file is checked after and still exists.
 * Errors are not captured and expected to be handled.
 */
export function deleteFileSync(path: string, options: { checkExists:true; force?:boolean; }): "NotFound" | boolean;

export function deleteFileSync(path: string, options?: { checkExists?:true | "before" | "after"; force?:boolean; }): "NotFound" | boolean {
	const checkExists = options?.checkExists ?? false;

	const checkBefore = checkExists === true || checkExists === "before";
	if (checkBefore) {
		const exists = fileExistsSync(path);

		// no file means exit early
		if (!exists) {
			return "NotFound";
		}
	}

	// allow force to be passed in, default to true
	const force = options?.force ?? true;

	// attempt to delete
	rmSync(path, { force });

	// check again to be sure
	const checkAfter = checkExists === true || checkExists === "after";
	if (checkAfter) {
		return !fileExistsSync(path);
	}

	// assume all went well
	return true;
}
