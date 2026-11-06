import type { Optional } from "@rsc-utils/core-utils";
import { parseJson } from "@rsc-utils/json-utils";
import { Logger } from "@rsc-utils/logger-utils";
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
				Logger.package("@rsc-utils/io-utils").error({ index, ex });
			}
		}
	});
	return objects;
}