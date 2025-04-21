import { error } from "@rsc-utils/core-utils";
import { mkdir, rm, symlink } from "fs";
import { toFilePath } from "./internal/toFilePath.js";

type Options = { mkdir?:boolean; overwrite?:boolean; };

export function symLink(original: string, link: string): Promise<boolean>;
export function symLink(original: string, link: string, options: Options): Promise<boolean>;
export async function symLink(target: string, path: string, options?: Options): Promise<boolean> {
	if (options?.mkdir) {
		await new Promise(res => {
			mkdir(toFilePath(path), { recursive:true }, err => {
				if (err) error(err); // NOSONAR
				res(!err);
			});
		});
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
				rm(path, { force:true }, () => symlink(target, path, "file", () => res(true)));

			}catch(inner) {
				error(inner);
				res(false);
			}
		}
	});
}