import { existsSync, mkdirSync } from "fs";
import type { Optional } from "../types/generics.js";
import { getFromProcess } from "./internal/getFromProcess.js";

function isValid(value: Optional<string | number>): value is string {
	return !!value && existsSync(String(value));
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
