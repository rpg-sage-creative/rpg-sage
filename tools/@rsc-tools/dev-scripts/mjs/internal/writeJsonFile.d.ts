/** Writes the given content to the given file path/name, optionally building the path if it doesn't exist, optionally formatting JSON output. */
export declare function writeJsonFile<T extends Record<string, any>>(filePathAndName: string, content: T): Promise<boolean>;
