import { readFileSync as fsReadFileSync } from "fs";
import { fileExistsSync } from "./fileExistsSync.js";

/** Returns a Buffer if the file exists and it can read a buffer, or null otherwise. */
export function readFileSync(path: string): Buffer | null {
	if (fileExistsSync(path)) {
		const buffer = fsReadFileSync(path);
		if (Buffer.isBuffer(buffer)) {
			return buffer;
		}
	}
	return null;
}
