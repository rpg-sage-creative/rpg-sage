import { readFile, readFileSync } from "./readFile";

//#region readTextFile

/**
 * Convenience for: readFile(path, encoding).then(buffer => buffer.toString(encoding));
 * Rejections from readFile are bubbled.
 */
export function readTextFile(path: string, encoding = "utf8"): Promise<string> {
	return new Promise((resolve, reject) => {
		readFile(path).then(buffer => {
			resolve(buffer.toString(encoding as BufferEncoding));
		}, reject);
	});
}

//#endregion

//#region readTextFileSync

/**
 * Convenience for: readFileSync(path).toString(encoding);
 * Returns null if readFileSync returns null.
 */
export function readTextFileSync(path: string, encoding = "utf8"): string | null {
	const buffer = readFileSync(path);
	return buffer?.toString(encoding as BufferEncoding) ?? null;
}

//#endregion