import { writeFileSync as fsWriteFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { contentToFileOutput } from "./internal/contentToFileOutput.js";

type Options = { makeDir?:boolean; formatted?:boolean; };

/** Writes the given content to the given file path/name, optionally building the path if it doesn't exist, optionally formatting JSON output. */
export function writeFileSync<T>(filePath: string, content: T, options?: Options): boolean {
	if (options?.makeDir) {
		const dirPath = dirname(filePath);
		mkdirSync(dirPath, { recursive:true });
	}

	fsWriteFileSync(filePath, contentToFileOutput(content, options?.formatted));

	return true;
}
