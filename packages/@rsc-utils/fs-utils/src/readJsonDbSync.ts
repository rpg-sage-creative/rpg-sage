import { parseJsonDb } from "./internal/parseJsonDb.js";
import { readTextSync } from "./readTextSync.js";

/**
 * Designed for reading a .json.db file that is a list of json items on each line, but not an array.
 */
export function readJsonDbSync<T>(path: string): T[] {
	const raw = readTextSync(path);
	return raw ? parseJsonDb(raw) : [];
}
