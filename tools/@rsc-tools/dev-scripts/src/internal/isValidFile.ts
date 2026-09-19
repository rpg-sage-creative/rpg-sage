import { statSync } from "node:fs";

const ValidFileRegExp = /(?<!index)\.([mc])?ts$/;

export function isValidFile(path: string) {
	try {
		const name = path.split("/").pop()!;
		return ValidFileRegExp.test(name) && statSync(path).isFile();
	}catch(ex) {
		// ignore
	}
	return false;
}