import { appendFile } from "./appendFile.js";
import { fileExists } from "./fileExists.js";
import { contentToFileOutput } from "./internal/contentToFileOutput.js";
import { writeFile } from "./writeFile.js";

/** Appends the given content to the given file path/name. */
export async function appendJsonDb<T>(filePath: string, content: T): Promise<boolean> {
	const exists = await fileExists(filePath);
	if (exists) {
		return appendFile(filePath, "\n" + contentToFileOutput(content));
	}
	return writeFile(filePath, content, { makeDir:true });
}