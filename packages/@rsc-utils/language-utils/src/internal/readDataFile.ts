import { existsSync, readFileSync } from "node:fs";

/**
 * @internal
 * Tries to read the given filePath.
 * If it fails, it reads the orFileName from node_modules.
 */
export function readDataFile(filePath: string | undefined, orFileName: string): string | undefined {
	const paths = [
		filePath,
		`./node_modules/@rsc-utils/language-utils/data/${orFileName}`,
		`../node_modules/@rsc-utils/language-utils/data/${orFileName}`
	];
	for (const path of paths) {
		try {
			if (path && existsSync(path)) {
				return readFileSync(path).toString();
			}
		}catch(ex) {
			// ignore
		}
	}
	return undefined;
}