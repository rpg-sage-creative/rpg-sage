import { readTextSync } from "./readTextSync";

/**
 * Convenience for: JSON.parse(readTextFile(path));
 */
export function readJsonFileSync<T>(path: string): T | null {
	const json = readTextSync(path);
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
