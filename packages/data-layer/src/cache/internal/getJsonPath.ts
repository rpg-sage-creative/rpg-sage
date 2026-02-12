import { getDataRoot } from "@rsc-utils/core-utils";
import type { CacheItemKey } from "../types.js";
import { join } from "node:path";

/**
 * @internal
 * Reusable function to avoid typoes when getting json file path.
 */
export function getJsonPath(key: CacheItemKey, id: string): string {
	return join(getDataRoot(join("sage", key)), `${id}.json`);
}