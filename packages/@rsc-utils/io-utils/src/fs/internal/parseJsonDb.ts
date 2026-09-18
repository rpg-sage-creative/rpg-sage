import { error, parseJson, type Optional } from "@rsc-utils/core-utils";

/**
 * @internal
 * Designed for reading a .json.db file that is a list of json items on each line, but not an array.
 */
export function parseJsonDb<T>(raw: Optional<string>): T[] {
	const objects: T[] = [];
	const lines = raw?.split("\n");
	lines?.forEach((line, index) => {
		const trimmed = line.trim();
		if (trimmed.length > 0) {
			try {
				objects.push(parseJson(trimmed));
			}catch(ex) {
				error({ index, ex });
			}
		}
	});
	return objects;
}