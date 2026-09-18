import type { Optional } from "@rsc-utils/type-utils";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { verbose } from "../console/index.js";
import { getFromProcess } from "./getFromProcess.js";
import type { ValidatorArg } from "./types.js";

const pathMap = new Map<string, string>();

/**
 * Helper function for flattening path args.
 * The given args array is shifted once and a value is returned:
 *   - a "string" is returned as is
 *   - an Array is returned using join()
 *   - all other values are returned as undefined
 */
function shiftPath(args: unknown[]): string | undefined {
	const arg = args.shift();
	if (typeof(arg) === "string") return arg;
	if (Array.isArray(arg)) return join(...arg);
	return undefined;
}

function _getDataRoot(): string {
	// get cached dataroot
	let dataRoot = pathMap.get("");

	if (!dataRoot) {
		// initialize it if we don't have it

		const dirValidator = (value: Optional<ValidatorArg>): value is string => typeof(value) === "string" ? existsSync(value) : false;

		// get from settings
		dataRoot = getFromProcess<string>(dirValidator, "dataRoot");

		// save to map
		pathMap.set("", dataRoot);
	}

	return dataRoot;
}

function _getDataPath(dataPath: string): string {
	// get cached dataDir
	let dataDir = pathMap.get(dataPath);

	if (!dataDir) {
		// initialize it if we don't have it

		// join to dataRoot
		dataDir = join(_getDataRoot(), dataPath);

		// create the dir if it doesn't exist
		if (!existsSync(dataDir)) {
			verbose(`Creating dataPath: ${dataDir}`);

			mkdirSync(dataDir, { recursive:true });
		}

		// save to map
		pathMap.set(dataPath, dataDir);
	}

	return dataDir;
}

function _getChildPath(_dataPath: string, childPath: string): string {
	// get cached childDir
	let childDir = pathMap.get(childPath);

	if (!childDir) {
		// initialize it if we don't have it

		// join to dataRoot
		childDir = join(_getDataPath(_dataPath), childPath);

		// save to map
		pathMap.set(childPath, childDir);
	}

	return childDir;
}

/**
 * Uses getFromProcess to get "dataRoot".
 * If "dataRoot" not found or the path is invalid, an error is thrown.
 * If dataPath is given the returned path will be join(dataRoot, dataPath).
 * If dataPath is given and doesn't exist, then dataPath will be created.
 * If childPath is given, the returned path will be join(dataRoot, dataPath, childPath).
 */
export function getDataRoot(dataPath?: string | string[], childPath?: string | string[]): string;

/**
 * @deprecated
 * Uses getFromProcess to get "dataRoot".
 * If "dataRoot" not found or the path is invalid, an error is thrown.
 * If dataPath is given the returned path will be join(dataRoot, dataPath).
 * If dataPath doesn't exist and ensurePathExists is true, then dataPath will be created.
 */
export function getDataRoot(dataPath: string, ensurePathExists: boolean): string;

export function getDataRoot(...args: unknown[]): string {
	const dataPath = shiftPath(args);
	if (!dataPath) {
		return _getDataRoot();
	}

	const childPath = shiftPath(args);
	if (!childPath) {
		return _getDataPath(dataPath);
	}

	return _getChildPath(dataPath, childPath);
}
