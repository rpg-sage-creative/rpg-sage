import { getLogger } from "./getLogger.js";

/** Convenience for getLogger().debug(...args) */
export function debug(...args: any[]) {
	getLogger().debug(...args);
}