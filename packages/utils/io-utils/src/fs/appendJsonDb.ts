import { appendFile, mkdir } from "fs";
import { contentToFileOutput } from "./internal/contentToFileOutput.js";
import { toFilePath } from "./internal/toFilePath.js";
import { fileExistsSync } from "./fileExistsSync.js";
import { writeFile } from "./writeFile.js";

function append<T>(filePathAndName: string, content: T): Promise<boolean> {
	return new Promise((resolve, reject) => {
		const exists = fileExistsSync(filePathAndName);
		if (exists) {
			appendFile(filePathAndName, "\n" + contentToFileOutput(content), error => {
				if (error) {
					reject(error);
				}else {
					resolve(true);
				}
			});
		}else {
			writeFile(filePathAndName, content, true).then(resolve, reject);
		}
	});
}

/** Appends the given content to the given file path/name, optionally building the path if it doesn't exist. */
export function appendJsonDb<T>(filePathAndName: string, content: T, makeDir?: boolean): Promise<boolean> {
	return new Promise((resolve, reject) => {
		if (makeDir) {
			mkdir(toFilePath(filePathAndName), { recursive:true }, error => {
				if (error) {
					reject(error);
				}else {
					append(filePathAndName, content).then(resolve, reject);
				}
			});
		}else {
			append(filePathAndName, content).then(resolve, reject);
		}
	});
}