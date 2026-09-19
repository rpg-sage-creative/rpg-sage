import { statSync } from "node:fs";

const ValidDirectoryRegExp = /^(?<!\.)\w/;

export function isValidDirectory(path: string) {
	try {
		const name = path.split("/").pop()!;
		return ValidDirectoryRegExp.test(name) && statSync(path).isDirectory();
	}catch(ex) {
		// ignore
	}
	return false;
}