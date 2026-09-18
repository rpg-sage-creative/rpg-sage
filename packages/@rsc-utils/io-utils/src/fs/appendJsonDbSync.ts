import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileExistsSync } from "./fileExistsSync.js";
import { contentToFileOutput } from "./internal/contentToFileOutput.js";

type Options = { makeDir?:boolean; };

/** Appends the given content to the given file path/name, optionally building the path if it doesn't exist. */
export function appendJsonDbSync<T>(filePath: string, content: T, options?: Options): boolean {
	if (options?.makeDir) {
		const dirPath = dirname(filePath);
		mkdirSync(dirPath, { recursive:true });
	}
	const exists = fileExistsSync(filePath);
	if (exists) {
		appendFileSync(filePath, "\n" + contentToFileOutput(content));
	}else {
		writeFileSync(filePath, contentToFileOutput(content));
	}
	return true;
}