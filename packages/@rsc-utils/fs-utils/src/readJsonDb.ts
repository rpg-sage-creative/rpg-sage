import { parseJsonDb } from "./internal/parseJsonDb.js";
import { readText } from "./readText.js";

/**
 * Designed for reading a .json.db file that is a list of json items on each line, but not an array.
 */
export function readJsonDb<T>(path: string): Promise<T[]> {
	return new Promise((resolve, reject) => {
		readText(path).then(raw => {
			const objects = raw ? parseJsonDb<T>(raw) : [];
			if (objects.length) {
				resolve(objects);
			}else {
				reject(`Unable to read "${path}"`);
			}
		}, reject);
	});
}
