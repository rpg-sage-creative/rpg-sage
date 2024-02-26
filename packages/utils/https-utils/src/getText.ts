import { getBuffer } from "./getBuffer.js";

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
export function getText<T = any>(url: string, postData: T): Promise<string>;
export function getText<T = any>(url: string, postData?: T): Promise<string> {
	return new Promise((resolve, reject) => {
		getBuffer(url, postData).then(buffer => {
			try {
				resolve(buffer.toString("utf8"));
			}catch(ex) {
				reject(ex);
			}
		}, reject);
	});
}