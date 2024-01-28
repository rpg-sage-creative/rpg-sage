import { getLogger } from "../getLogger.js";

/** Convenience for getLogger().verbose(...args) */
export function verbose(...args: any[]) {
	getLogger().verbose(...args);
}