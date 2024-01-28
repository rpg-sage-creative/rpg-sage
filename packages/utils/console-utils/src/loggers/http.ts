import { getLogger } from "../getLogger.js";

/** Convenience for getLogger().http(...args) */
export function http(...args: any[]) {
	getLogger().http(...args);
}