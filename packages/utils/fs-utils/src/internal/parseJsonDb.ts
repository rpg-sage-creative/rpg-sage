import { error } from "@rsc-utils/console-utils";
import { parse } from "@rsc-utils/json-utils";

/**
 * @private
 * Designed for reading a Foundry .db file that is a list of json items on each line, but not an array.
 */
export function parseJsonDb<T>(raw: string): T[] {
	const objects: T[] = [];
	const lines = (raw ?? "").split(/\r?\n\r?/);
	lines.forEach((line, index) => {
		const trimmed = line.trim();
		if (trimmed.length > 0) {
			try {
				objects.push(parse(trimmed));
			}catch(ex) {
				error({ index, ex });
			}
		}
	});
	return objects;
}