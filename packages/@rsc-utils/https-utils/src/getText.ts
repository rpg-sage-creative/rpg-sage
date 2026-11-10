import { getBuffer, type GetBufferOpts } from "./getBuffer.js";

export type GetTextOpts = GetBufferOpts & {
	/** defaults to "utf8" */
	bufferEncoding?: BufferEncoding;
};

/**
 * You can pass in a fully formed url or leave off the protocol and allow it to prepend "https://".
 * If you pass in a url with "http://" it will downgrade to use http protocol instead of https.
*/
export function getText(url: string): Promise<string>;
/**
 * You can pass in a fully formed url or leave off the protocol and allow it to prepend "https://".
 * If you pass in a url with "http://" it will downgrade to use http protocol instead of https.
 * Sending postData will stringify the value and then do a POST instead of a GET.
*/
export function getText<T = any>(url: string, postData: T, opts?: GetTextOpts): Promise<string>;

export function getText<T = any>(url: string, postData?: T, opts?: GetTextOpts): Promise<string> {
	return new Promise((resolve, reject) => {
		const { bufferEncoding = "utf8", ...options } = opts ?? {};
		getBuffer(url, postData, options).then(buffer => {
			try {
				resolve(buffer.toString(bufferEncoding));
			}catch(ex) {
				reject(ex);
			}
		}, reject);
	});
}