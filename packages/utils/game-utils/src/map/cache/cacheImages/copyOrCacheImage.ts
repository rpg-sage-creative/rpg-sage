import { error, errorReturnFalse, verbose } from "@rsc-utils/core-utils";
import { cacheFile } from "@rsc-utils/io-utils";
import { copyFileSync, existsSync } from "fs";
import { ensurePath } from "../../utils/ensurePath.js";

/**
 * @internal
 */
export async function copyOrCacheImage(source: string, destination: string): Promise<boolean> {
	let success = false;
	try {
		if (existsSync(destination)) {
			verbose(`Cache exists for ${destination}) ...`);
			success = true;
		}else {
			ensurePath({ filePath:destination });
			if (!(/^https?:\/\//i).test(source) && existsSync(source)) {
				verbose(`Caching local image ${source} to ${destination}) ...`);
				copyFileSync(source, destination);
				success = existsSync(destination);
			}else {
				verbose(`Caching remote image ${source} to ${destination}) ...`);
				success = await cacheFile(source, destination).catch(errorReturnFalse);
			}
		}
	}catch(ex) {
		error(ex);
		success = false;
	}
	return success;
}
