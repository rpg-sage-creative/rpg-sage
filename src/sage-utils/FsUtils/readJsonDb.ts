import { isNotBlank } from "../StringUtils";
import { readText } from "./readText";

/**
 * Designed for reading a Foundry .db file that is a list of json items on each line, but not an array.
 */
export function readJsonDb<T>(path: string): Promise<T[]> {
	return new Promise((resolve, reject) => {
		readText(path).then(raw => {
			const objects: T[] = [];
			const lines = raw.split(/\r?\n\r?/).filter(isNotBlank);
			lines.forEach((line, index) => {
				try {
					objects.push(JSON.parse(line));
				}catch(ex) {
					console.error({ index, ex });
				}
				if (objects.length) {
					resolve(objects);
				}else {
					reject(`Unable to read "${path}"`);
				}
			}, reject);
		});
	});
}
