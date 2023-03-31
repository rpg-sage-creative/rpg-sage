import { existsSync, readFile as fsReadFile, readFileSync as fsReadFileSync } from "fs";

//#region readFile

/**
 * Resolves with a buffer of the file's contents, or rejects with "Not a Buffer" or an error (if one occured).
 */
export function readFile(path: string): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		fsReadFile(path, null, (error: NodeJS.ErrnoException | null, buffer: Buffer) => {
			if (error) {
				reject(error);
			}else if (Buffer.isBuffer(buffer)) {
				resolve(buffer);
			}else {
				reject("Not a Buffer");
			}
		});
	});
}

//#endregion

//#region readFileSync

/** Returns a Buffer if the file exists and it can read a buffer, or null otherwise. */
export function readFileSync(path: string): Buffer | null {
	if (existsSync(path)) {
		const buffer = fsReadFileSync(path);
		if (Buffer.isBuffer(buffer)) {
			return buffer;
		}
	}
	return null;
}

//#endregion
