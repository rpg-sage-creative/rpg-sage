import { appendFile as fsAppendFile } from "node:fs";

/** Convenience wrapper for fs.appendFile(filePath, data) that resolves to boolean. */
export function appendFile(filePath: string, data: string | Buffer): Promise<boolean> {
	return new Promise((resolve, reject) => {
		fsAppendFile(filePath, data, error =>
			error ? reject(error) : resolve(true)
		);
	});
}