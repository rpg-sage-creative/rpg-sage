import { readFile } from "node:fs";

export function readJsonFile<T>(path: string): Promise<T | undefined> {
	return new Promise<T | undefined>((resolve, reject) => {
		readFile(path, (err, data) => {
			try {
				err ? reject(err) : resolve(JSON.parse(data.toString("utf8")));
			}catch(ex) {
				reject(ex);
			}
		});
	});
}