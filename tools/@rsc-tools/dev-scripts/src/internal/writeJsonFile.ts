import { writeFile } from "node:fs";

/** Writes the given content to the given file path/name, optionally building the path if it doesn't exist, optionally formatting JSON output. */
export async function writeJsonFile<T extends Record<string, any>>(filePathAndName: string, content: T): Promise<boolean> {
	return new Promise((resolve, reject) =>
		writeFile(filePathAndName, JSON.stringify(content, undefined, "\t"), error =>
			error ? reject(error) : resolve(true)
		)
	);
}
