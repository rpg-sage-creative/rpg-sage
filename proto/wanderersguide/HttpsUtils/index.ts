import * as http from "http";
import * as https from "https";

export function getProtocol(url: string): typeof http | typeof https {
	return url.match(/^http:\/\//i) ? http : https;
}

type THeaders = { [key: string]: string | number; };
function createHeaders(payloadLength?: number, headers?: THeaders): THeaders {
	let out: THeaders = { };
	if (headers) {
		out = { ...headers };
	}
	if (payloadLength) {
		out["Content-Type"] = "application/json";
		out["Content-Length"] = payloadLength;
	}
	return out;
}

export const NULL_POST_DATA = { NULL_POST_DATA:"NULL_POST_DATA" };
function stringifyPostData(postData?: any): string | null {
	if (postData !== undefined && postData !== null) {
		if (postData === NULL_POST_DATA || postData["NULL_POST_DATA"] === "NULL_POST_DATA") {
			return null;
		}
		if (typeof(postData) === "string") {
			return postData;
		}
		return JSON.stringify(postData);
	}
	return null;
}

/**
 * You can pass in a fully formed url or leave off the protocol and allow it to prepend "https://".
 * If you pass in a url with "http://" it will downgrade to use http protocol instead of https.
*/
export function getBuffer(url: string): Promise<Buffer>;
/**
 * You can pass in a fully formed url or leave off the protocol and allow it to prepend "https://".
 * If you pass in a url with "http://" it will downgrade to use http protocol instead of https.
 * Sending postData will JSON.stringify the value and then do a POST instead of a GET.
*/
export function getBuffer<T = any>(url: string, postData: T): Promise<Buffer>;
export function getBuffer<T = any, U extends THeaders = THeaders>(url: string, postData?: T, headers?: U): Promise<Buffer>;
export function getBuffer<T = any, U extends THeaders = THeaders>(url: string, postData?: T, headers?: U): Promise<Buffer> {
	if (typeof(url) !== "string") {
		return Promise.reject("Invalid Url");
	}
	if (!url.match(/^https?:\/\//i)) {
		url = "https://" + url;
	}
	const protocol = getProtocol(url);
	const method = postData ? "request" : "get";
	const payload = stringifyPostData(postData);
	return new Promise((resolve, reject) => {
		try {
			const options = {
				method: method === "get" ? "GET" : "POST",
				headers: createHeaders(payload?.length, headers)
			};console.log(options)
			const req = protocol[method](url, options, response => {
				try {
					const chunks: Buffer[] = [];
					response.on("data", (chunk: Buffer) =>
						chunks.push(chunk)
					);
					response.once("close", reject);
					response.once("end", () =>
						resolve(Buffer.concat(chunks))
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
				if (payload !== null) {
					req.write(payload);
				}
				req.end();
			}
		}catch(ex) {
			reject(ex);
		}
	});
}

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
export function getText<T = any, U extends THeaders = THeaders>(url: string, postData?: T, headers?: U): Promise<string>;
export function getText<T = any, U extends THeaders = THeaders>(url: string, postData?: T, headers?: U): Promise<string> {
	return new Promise((resolve, reject) => {
		getBuffer(url, postData, headers).then(buffer => {
			try {
				resolve(buffer.toString("utf8"));
			}catch(ex) {
				reject(ex);
			}
		}, reject);
	});
}

/** Convenience wrapper for getText(url).then(text => JSON.parse(text)) */
export function getJson<T = any>(url: string): Promise<T>;
export function getJson<T = any, U = any>(url: string, postData: U): Promise<T>;
export function getJson<T = any, U = any, V extends THeaders = THeaders>(url: string, postData?: U, headers?: V): Promise<T>;
export function getJson<T = any, U = any, V extends THeaders = THeaders>(url: string, postData?: U, headers?: V): Promise<T> {
	return new Promise((resolve, reject) => {
		getText(url, postData, headers).then(text => {
			try {
				resolve(JSON.parse(text));
			}catch(ex) {
				reject(ex);
			}
		}, reject);
	});
}
