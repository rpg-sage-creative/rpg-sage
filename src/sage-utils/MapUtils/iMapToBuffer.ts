import { errorReturnNull } from "../ConsoleUtils";
import { getBuffer } from "../HttpsUtils";
import { tMapToBuffer } from "./tMapToBuffer";
import type { IMap } from "./types";

type mimeType = "image/png" | "image/jpeg";

/** Catches an error when using an internal server to creating image buffers. */
function catchBufferFetch(err: any): null {
	if (String(err).includes("ECONNREFUSED")) {
		console.warn(`MapServer down, creating internally.`);
	}else {
		console.error(err);
	}
	return null;
}

/** fetches and returns an image Buffer */
export async function iMapToBuffer(iMap: IMap, fileType?: mimeType): Promise<Buffer | null> {
	const tMap = await Promise.resolve(iMap.toJSON()).catch(errorReturnNull);
	if (tMap) {
		const buffer = await getBuffer("http://localhost:3000", tMap).catch(catchBufferFetch);
		return buffer ?? tMapToBuffer(tMap, fileType);
	}
	return null;
}
