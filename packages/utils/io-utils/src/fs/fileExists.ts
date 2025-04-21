import { exists } from "fs";

/**
 * Checks to see if the given file exists.
 * (Wrapper for fs.exists so that I have the option to add additional logic later if needed.)
 * @todo use fs.stat to avoid deprecated fs.exists !?
 */
export function fileExists(path: string): Promise<boolean> {
	return new Promise<boolean>((resolve, reject) => {
		try {
			exists(path, resolve);
		}catch(ex) {
			reject(ex);
		}
	});
}
