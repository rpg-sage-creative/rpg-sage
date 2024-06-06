import { rmSync } from "fs";
import { fileExistsSync } from "./fileExistsSync.js";

/**
 * Returns true if the file existed *and* was deleted.
 * Returns false if the file didn't exist or wasn't deleted.
 */
export function deleteFileSync(path: string): boolean {
	const before = fileExistsSync(path);
	if (before) {
		rmSync(path);
		const after = fileExistsSync(path);
		return before !== after;
	}
	return false;
}
