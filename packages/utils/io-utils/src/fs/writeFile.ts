import { writeFile as fsWriteFile, mkdir } from "fs";
import { contentToFileOutput } from "./internal/contentToFileOutput.js";
import { toFilePath } from "./internal/toFilePath.js";

function write<T>(filePathAndName: string, content: T, formatted?: boolean): Promise<boolean> {
	return new Promise((resolve, reject) => {
		fsWriteFile(filePathAndName, contentToFileOutput(content, formatted), error => {
			if (error) {
				reject(error);
			}else {
				resolve(true);
			}
		});
	});

}

/** Writes the given content to the given file path/name, optionally building the path if it doesn't exist, optionally formatting JSON output. */
export function writeFile<T>(filePathAndName: string, content: T, makeDir?: boolean, formatted?: boolean): Promise<boolean> {
	return new Promise((resolve, reject) => {
		if (makeDir) {
			mkdir(toFilePath(filePathAndName), { recursive:true }, error => {
				if (error) {
					reject(error);
				}else {
					write(filePathAndName, content, formatted).then(resolve, reject);
				}
			});
		}else {
			write(filePathAndName, content, formatted).then(resolve, reject);
		}
	});
}
