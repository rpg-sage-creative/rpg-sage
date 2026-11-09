import { readFileSync } from "./readFileSync.js";

/**
 * Convenience for: readFileSync(path).toString(encoding);
 * Returns null if readFileSync returns null.
 */
export function readTextSync(path: string, encoding = "utf8"): string | null {
	const buffer = readFileSync(path);
	return buffer?.toString(encoding as BufferEncoding) ?? null;
}
