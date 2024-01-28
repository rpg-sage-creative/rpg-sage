import { getLogger } from "../getLogger.js";

/** Convenience for getLogger().warn(...args) */
export function warn(...args: any[]) {
	getLogger().warn(...args);
}