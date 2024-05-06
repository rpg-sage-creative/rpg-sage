import { parse } from "./bigint/parse.js";
import { stringify } from "./bigint/stringify.js";

/** BigInt safe JSON.parse(JSON.stringify(object)) */
export function cloneJson<T>(object: unknown): T {
	if (object === undefined) {
		throw new SyntaxError(`JSON Parse error: Unexpected identifier "undefined"`);
	}
	return parse(stringify(object));
}