import * as fs from "fs";
import { formattedStringify } from "../JsonUtils";

export function fileExistsSync(path: string): boolean {
	return fs.existsSync(path);
}

export function listFiles(path: string): Promise<string[]> {
	return new Promise((resolve, reject) => {
		fs.readdir(path, (error: NodeJS.ErrnoException | null, files: string[]) => {
			error ? reject(error) : resolve(files);
		});
	});
}

export function listFilesSync(path: string): string[] {
	try {
		return fs.readdirSync(path);
	}catch(ex) {
		console.error(ex);
	}
	return [];
}

type TFileFilter = (file: string) => boolean;
export async function filterFiles(path: string, filter: TFileFilter, recursive = false): Promise<string[]> {
	const output: string[] = [];
	const files = await listFiles(path).catch(() => []);
	for (const file of files) {
		if (filter(file)) {
			output.push(`${path}/${file}`);
		}else if (recursive) {
			output.push(...(await filterFiles(`${path}/${file}`, filter, true)));
		}
	}
	return output;
}

export function filterFilesSync(path: string, filter: TFileFilter, recursive = false): string[] {
	const output: string[] = [];
	const files = listFilesSync(path);
	for (const file of files) {
		if (filter(file)) {
			output.push(`${path}/${file}`);
		}else if (recursive) {
			output.push(...(filterFilesSync(`${path}/${file}`, filter, true)));
		}
	}
	return output;
}

/**
 * Resolves with a buffer of the file's contents, or rejects with "Not a Buffer" or an error if one occured.
 */
export function readFile(path: string): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		fs.readFile(path, null, (error: NodeJS.ErrnoException | null, buffer: Buffer) => {
			if (error) {
				reject(error);
			}else if (Buffer.isBuffer(buffer)) {
				resolve(buffer);
			}else {
				reject("Not a Buffer");
			}
		});
	});
}

/** Returns a Buffer if the file exists and it can read a buffer, or null otherwise. */
export function readFileSync(path: string): Buffer | null {
	if (fs.existsSync(path)) {
		const buffer = fs.readFileSync(path);
		if (Buffer.isBuffer(buffer)) {
			return buffer;
		}
	}
	return null;
}

/**
 * Convenience for: readFile(path, encoding).then(buffer => buffer.toString(encoding));
 * Rejections from readFile are bubbled.
 */
export function readTextFile(path: string, encoding = "utf8"): Promise<string> {
	return new Promise((resolve, reject) => {
		readFile(path).then(buffer => {
			resolve(buffer.toString(encoding as BufferEncoding));
		}, reject);
	});
}

/**
 * Convenience for: readFileSync(path).toString(encoding);
 * Returns null if readFileSync returns null.
 */
export function readTextFileSync(path: string, encoding = "utf8"): string | null {
	const buffer = readFileSync(path);
	return buffer?.toString(encoding as BufferEncoding) ?? null;
}

/**
 * Convenience for: readTextFile(path).then(json => JSON.parse(json));
 * An error while parsing will be rejected.
 * Rejections from readTextFile and readFile are bubbled.
 */
export function readJsonFile<T>(path: string): Promise<T | null> {
	return new Promise((resolve, reject) => {
		readTextFile(path).then(json => {
			let object: T | null | undefined;
			try {
				object = JSON.parse(json);
			}catch(ex) {
				reject(ex);
			}
			if (object !== undefined) {
				resolve(object as T);
			}else {
				// In case we didn't reject an exception somehow, we don't want the Promise to hang ...
				reject("Unable to parse!");
			}
		}, reject);
	});
}

/**
 * Convenience for: JSON.parse(readTextFile(path));
 */
export function readJsonFileSync<T>(path: string): T | null {
	const json = readTextFileSync(path);
	let object!: T | null;
	if (json !== null) {
		try {
			object = JSON.parse(json);
		}catch(ex) {
			object = null;
		}
	}
	return object ?? null;
}

function toFilePath(filePathAndName: string): string {
	return filePathAndName?.split(/\//).slice(0, -1).join("/");
}
function contentToFileOutput<T>(content: T, formatted = false): string | Buffer {
	if (Buffer.isBuffer(content)) {
		return content;
	}
	if (typeof(content) === "string") {
		return content;
	}
	return formatted
		? formattedStringify(content)
		: JSON.stringify(content);
}

export function writeFile<T>(filePathAndName: string, content: T): Promise<boolean>;
export function writeFile<T>(filePathAndName: string, content: T, mkdir: boolean): Promise<boolean>;
export function writeFile<T>(filePathAndName: string, content: T, mkdir: boolean, formatted: boolean): Promise<boolean>;
export function writeFile<T>(filePathAndName: string, content: T, mkdir?: boolean, formatted?: boolean): Promise<boolean> {
	return new Promise((resolve, reject) => {
		const errors: unknown[] = [];
		if (mkdir) {
			fs.mkdir(toFilePath(filePathAndName), { recursive:true }, error => {
				if (error) {
					errors.push(error);
				}
			});
		}
		fs.writeFile(filePathAndName, contentToFileOutput(content, formatted), error => {
			if (error) {
				errors.push(error);
				reject(errors);
			}else {
				resolve(true);
			}
		});
	});
}

export function writeFileSync<T>(filePathAndName: string, content: T): boolean;
export function writeFileSync<T>(filePathAndName: string, content: T, mkdir: boolean): boolean;
export function writeFileSync<T>(filePathAndName: string, content: T, mkdir: boolean, formatted: boolean): boolean;
export function writeFileSync<T>(filePathAndName: string, content: T, mkdir?: boolean, formatted?: boolean): boolean {
	try {
		if (mkdir) {
			fs.mkdirSync(toFilePath(filePathAndName), { recursive:true });
		}
	} catch(ex) {
		console.error(ex);
	}
	try {
		fs.writeFileSync(filePathAndName, contentToFileOutput(content, formatted));
	} catch(ex) {
		console.error(ex);
		return false;
	}
	return true;
}
