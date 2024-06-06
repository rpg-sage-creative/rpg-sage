import { error } from "@rsc-utils/core-utils";
import { mkdirSync, rmSync, symlinkSync } from "fs";
import { toFilePath } from "./internal/toFilePath.js";

type Options = { mkdir?:boolean; overwrite?:boolean; };

export function symLinkSync(original: string, link: string): boolean;
export function symLinkSync(original: string, link: string, options: Options): boolean;
export function symLinkSync(target: string, path: string, options?: Options): boolean {
	try {
		if (options?.mkdir) {
			mkdirSync(toFilePath(path), { recursive:true });
		}
	}catch(ex) {
		error(ex);
	}
	try {
		// let's just try to make it and catch the EEXIST error
		symlinkSync(target, path, "file");

	}catch(outer: any) {
		const overwrite = outer.code === "EEXIST" && options?.overwrite;
		if (!overwrite) {
			error(outer);
			return false;
		}

		try {
			// remove existing
			rmSync(path, { force:true });

			// try again
			symlinkSync(target, path, "file");

		}catch(inner) {
			error(inner);
			return false;
		}
	}
	return true;
}