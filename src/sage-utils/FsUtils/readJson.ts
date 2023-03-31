import { isNotBlank } from "../StringUtils";
import { readTextFile, readTextFileSync } from "./readText";

//#region readJsonFile

/**
 * Convenience for: readTextFile(path).then(json => JSON.parse(json));
 * An error while parsing will be rejected.
 * Rejections from readTextFile and readFile are bubbled.
 */
export function readJsonFile<T>(path: string): Promise<T | null> {
	return new Promise((resolve, reject) => {
		readTextFile(path).then(json => {
			let object: T | null | undefined;
			try {
				object = JSON.parse(json);
			}catch(ex) {
				reject(ex);
			}
			if (object !== undefined) {
				resolve(object as T);
			}else {
				// In case we didn't reject an exception somehow, we don't want the Promise to hang ...
				reject("Unable to parse!");
			}
		}, reject);
	});
}

//#endregion

//#region readJsonFileSync

/**
 * Convenience for: JSON.parse(readTextFile(path));
 */
export function readJsonFileSync<T>(path: string): T | null {
	const json = readTextFileSync(path);
	let object!: T | null;
	if (json !== null) {
		try {
			object = JSON.parse(json);
		}catch(ex) {
			object = null;
		}
	}
	return object ?? null;
}

//#endregion

//#region readJsonDb

/**
 * Designed for reading a Foundry .db file that is a list of json items on each line, but not an array.
 */
export function readJsonDb<T>(path: string): Promise<T[]> {
	return new Promise((resolve, reject) => {
		readTextFile(path).then(raw => {
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

//#endregion
