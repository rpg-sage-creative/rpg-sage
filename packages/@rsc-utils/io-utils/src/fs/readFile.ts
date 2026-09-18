import { readFile as fsReadFile } from "node:fs";

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
