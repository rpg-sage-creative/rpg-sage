import { verbose } from "@rsc-utils/core-utils";
import { getProtocol } from "./getProtocol.js";

/**
 * Attempts to get the file size (content-length) from a url.
 * Returns the number of bytes, or rejects if an error occurs.
 */
export function getFileSize(url: string): Promise<number> {
	return new Promise(async (resolve, reject) => {
		verbose(`getFileSize: ${url}`);
		const protocol = getProtocol(url);
		const request = protocol.request(url, { method:"HEAD" }, response => {
			try {
				const stringValue = response.headers["content-length"];
				const numberValue = stringValue ? +stringValue : -1;
				const contentLength = isNaN(numberValue) ? -1 : numberValue;
				resolve(contentLength);
			}catch(ex) {
				reject(ex);
			}
		});
		request.once("error", reject);
		request.end();
	});
}