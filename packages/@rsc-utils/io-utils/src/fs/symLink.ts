import { error } from "@rsc-utils/core-utils";
import { symlink } from "node:fs";
import { dirname } from "node:path";
import { deleteFile } from "./deleteFile.js";
import { makeDir } from "./makeDir.js";

type Options = { makeDir?:boolean; overwrite?:boolean; };

export function symLink(original: string, link: string): Promise<boolean>;
export function symLink(original: string, link: string, options: Options): Promise<boolean>;
export async function symLink(target: string, path: string, options?: Options): Promise<boolean> {
	if (options?.makeDir) {
		const pathParent = dirname(path);
		await makeDir(pathParent);
	}

	return new Promise<boolean>(async res => {
		try {
			// let's just try to make it and catch the EEXIST error
			symlink(target, path, "file", () => res(true));

		}catch(outer: any) {
			const overwrite = outer?.code === "EEXIST" && options?.overwrite;
			if (!overwrite) {
				error(outer);
				res(false);
				return;
			}

			try {
				// remove existing and try again
				const deleted = await deleteFile(path);
				if (deleted) {
					symlink(target, path, "file", () => res(true));
				}else {
					res(false);
				}

			}catch(inner) {
				error(inner);
				res(false);
			}
		}
	});
}