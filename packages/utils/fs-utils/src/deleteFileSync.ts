import { existsSync, rmSync } from "fs";

/**
 * Returns true if the file existed *and* was deleted.
 * Returns false if the file didn't exist or wasn't deleted.
 */
export function deleteFileSync(path: string): boolean {
	const before = existsSync(path);
	if (before) {
		rmSync(path);
		const after = existsSync(path);
		return before !== after;
	}
	return false;
}
