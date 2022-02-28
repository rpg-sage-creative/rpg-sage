import * as http from "http";
import * as https from "https";

/**
 * You can pass in a fully formed url or leave off the protocol and allow it to prepend "https://".
 * If you pass in a url with "http://" it will downgrade to use http protocol instead of https.
*/
export function getText(url: string): Promise<string>;
/**
 * You can pass in a fully formed url or leave off the protocol and allow it to prepend "https://".
 * If you pass in a url with "http://" it will downgrade to use http protocol instead of https.
 * Sending postData will JSON.stringify the value and then do a POST instead of a GET.
*/
export function getText<T = any>(url: string, postData: T): Promise<string>;
/**
 * You can pass in a fully formed url or leave off the protocol and allow it to prepend "https://".
 * If you pass in a url with "http://" it will downgrade to use http protocol instead of https.
 * Sending postData will JSON.stringify the value and then do a POST instead of a GET.
*/
export function getText<T = any>(url: string, postData: T, stringifier: (postData: T) => string): Promise<string>;
export function getText<T = any>(url: string, postData?: T, stringifier?: (postData: T) => string): Promise<string> {
	if (typeof(url) !== "string") {
		return Promise.reject("Invalid Url");
	}
	if (!url.match(/^https?:\/\//i)) {
		url = "https://" + url;
	}
	const protocol = url.match(/^http:\/\//i) ? http : https;
	const method = postData ? "request" : "get";
	return new Promise((resolve, reject) => {
		try {
			const req = protocol[method](url, response => {
				try {
					const chunks: string[] = [];
					response.on("data", chunk =>
						chunks.push(Buffer.isBuffer(chunk) ? chunk.toString("utf8") : chunk)
					);
					response.once("close", reject);
					response.once("end", () =>
						resolve(chunks.join(""))
					);
					response.once("error", reject);
				}catch(ex) {
					reject(ex);
				}
			});
			req.once("close", reject);
			req.once("error", reject);
			req.once("timeout", reject);
			if (method === "request") {
				const stringified = stringifier ? stringifier(postData!) : JSON.stringify(postData);
				req.write(stringified);
				req.end();
			}
		}catch(ex) {
			reject(ex);
		}
	});
}

/** Convenience wrapper for getText(url).then(text => JSON.parse(text)) */
export function getJson<T = any>(url: string): Promise<T>;
export function getJson<T = any, U = any>(url: string, postData: U): Promise<T>;
export function getJson<T = any, U = any>(url: string, postData: U, stringifier: (postData: U) => string): Promise<T>;
export function getJson<T = any, U = any>(url: string, postData?: U, stringifier?: (postData: U) => string): Promise<T> {
	return new Promise((resolve, reject) => {
		getText(url, postData!, stringifier!).then(text => {
			try {
				resolve(JSON.parse(text));
			}catch(ex) {
				reject(ex);
			}
		}, reject);
	});
}
