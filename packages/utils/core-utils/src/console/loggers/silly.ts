import { getLogger } from "./getLogger.js";

/** Convenience for getLogger().silly(...args) */
export function silly(...args: any[]) {
	getLogger().silly(...args);
}