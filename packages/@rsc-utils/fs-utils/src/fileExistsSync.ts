import { existsSync } from "node:fs";

/**
 * Checks to see if the given file exists.
 * (Wrapper for fs.existsSync so that I have the option to add additional logic later if needed.)
 */
export function fileExistsSync(path: string): boolean {
	return existsSync(path);
}
