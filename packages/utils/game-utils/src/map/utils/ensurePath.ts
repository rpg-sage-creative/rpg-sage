import { error, verbose } from "@rsc-utils/core-utils";
import { existsSync, mkdirSync } from "fs";

type Options = { filePath?:string; dirPath?:string; };

/**
 * @internal
 */
export function ensurePath(opts: Options): boolean {
	try {
		const dirPath = opts.dirPath
			?? opts.filePath?.split("/").slice(0, -1).join("/");

		if (!dirPath?.trim()) {
			return false;
		}

		if (existsSync(dirPath)) {
			return true;
		}

		verbose(`Creating folder: ${dirPath}`);
		mkdirSync(dirPath, { recursive:true });
		return true;

	}catch(ex) {
		error(ex);
	}
	return false;
}