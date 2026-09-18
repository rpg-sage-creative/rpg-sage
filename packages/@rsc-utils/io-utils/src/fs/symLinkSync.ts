import { error } from "@rsc-utils/core-utils";
import { mkdirSync, rmSync, symlinkSync } from "node:fs";
import { dirname } from "node:path";

type Options = { makeDir?:boolean; overwrite?:boolean; };

export function symLinkSync(original: string, link: string): boolean;
export function symLinkSync(original: string, link: string, options: Options): boolean;
export function symLinkSync(target: string, path: string, options?: Options): boolean {
	try {
		if (options?.makeDir) {
			const pathParent = dirname(path);
			mkdirSync(pathParent, { recursive:true });
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