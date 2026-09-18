import { writeFile as fsWriteFile } from "node:fs";
import { dirname } from "node:path";
import { contentToFileOutput } from "./internal/contentToFileOutput.js";
import { makeDir } from "./makeDir.js";

type Options = { makeDir?:boolean; formatted?:boolean; };

/** Writes the given content to the given file path/name, optionally building the path if it doesn't exist, optionally formatting JSON output. */
export async function writeFile<T>(filePath: string, content: T, options?: Options): Promise<boolean> {
	if (options?.makeDir) {
		const dirPath = dirname(filePath);
		await makeDir(dirPath);
	}

	return new Promise((resolve, reject) =>
		fsWriteFile(filePath, contentToFileOutput(content, options?.formatted), error =>
			error ? reject(error) : resolve(true)
		)
	);
}
