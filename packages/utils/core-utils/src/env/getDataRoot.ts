import { existsSync, mkdirSync } from "fs";
import type { Optional } from "../types/generics.js";
import { getFromProcess } from "./getFromProcess.js";

const pathMap = new Map<string, string>();

/**
 * Uses getFromProcess to get "dataRoot".
 * If not found or the path is invalid, an error is thrown.
 * If childPath is given the returned path will be `${dataRoot}/${childPath}`.
 * If childPath is given and is invalid, an error is thrown.
 */
export function getDataRoot(childPath?: string, ensureChildExists?: boolean): string {
	// get cached dataroot
	let dataRoot = pathMap.get("");

	// initialize it
	if (!dataRoot) {
		const dirValidator = (value: Optional<string | number>): value is string => value ? existsSync(String(value)) : false;

		// get from settings
		dataRoot = getFromProcess<string>(dirValidator, "dataRoot");

		// save to map
		pathMap.set("", dataRoot);
	}

	// return it if no childPath requested
	if (!childPath) {
		return dataRoot;
	}

	// get cached dataPath
	let dataPath = pathMap.get(childPath);

	if (!dataPath) {
		// concat child path
		dataPath = `${dataRoot}/${childPath}`;

		if (ensureChildExists) {
			mkdirSync(dataPath, { recursive:true });
		}

		pathMap.set(childPath, dataPath);
	}

	return dataPath;
}
