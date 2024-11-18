import { existsSync, mkdirSync } from "fs";
import path from "path";
import type { Optional } from "../types/generics.js";
import { getFromProcess } from "./internal/getFromProcess.js";

/** Converts a path relative to the executing .*js file to an absolute path. */
function relativeToAbsolute(relative: string): string {
	const filename = process.argv[1];
	const dirname = path.dirname(filename);
	return path.join(dirname, relative);
}

/** Checks to see  */
function isValid(value: Optional<string | number>): value is string {
	if (value) {
		const string = String(value);
		if (string.startsWith(".")) {
			return existsSync(relativeToAbsolute(string));
		}
		return existsSync(string);
	}
	return false;
}

let _dataRoot: string;
export function getDataRoot(childPath?: string, ensureExists?: boolean): string {
	// get dataroot
	if (!_dataRoot) {
		_dataRoot = getFromProcess(isValid, "dataRoot");
	}

	// return it if not childPath requested
	if (!childPath) {
		return _dataRoot;
	}

	const dataPath = `${_dataRoot}/${childPath}`;

	// if child path exists, return it
	if (existsSync(dataPath)) {
		return dataPath;
	}

	// if we are to ensure it exists, try to make it
	if (ensureExists) {
		try {
			mkdirSync(dataPath, { recursive:true });
		}catch {
			// ignore, we throw below
		}
	}

	// if child path exists, return it
	if (existsSync(dataPath)) {
		return dataPath;
	}

	// throw error
	throw new Error(`Unable to create dataRoot child: ${dataPath}`);
}
