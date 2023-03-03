import type { Override, RedirectScheme } from "follow-redirects";
import * as _followRedirects from "follow-redirects";
import type * as coreHttp from "http";
import type * as coreHttps from "https";
import type { Optional } from "../..";
import type { ESCAPED_URL, VALID_URL } from "./types";
const { http, https } = (_followRedirects as any).default as typeof _followRedirects;

export type thttp = Override<
    typeof coreHttp,
    RedirectScheme<coreHttp.RequestOptions, coreHttp.ClientRequest, coreHttp.IncomingMessage>
>;
export type thttps = Override<
    typeof coreHttps,
    RedirectScheme<coreHttps.RequestOptions, coreHttp.ClientRequest, coreHttp.IncomingMessage>
>;

export function getProtocol(url: string): thttp | thttps {
	return url.match(/^http:\/\//i) ? http : https;
}

/** Returns true if the value starts with http:// or https:// and allows for <> brackets */
export function isUrl(value: Optional<string>): value is VALID_URL | ESCAPED_URL {
	return value?.match(/^https?:\/\/|^<https?:\/\/.*?>$/i) !== null;
}

/** Removes any <> brackets from the given url. */
export function cleanUrl(value: VALID_URL | ESCAPED_URL): VALID_URL {
	if (value.startsWith("<") && value.endsWith(">")) {
		return value.slice(1, -1).trim() as VALID_URL;
	}
	return value as VALID_URL;
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
export function getBuffer<T = any>(url: string, postData?: T): Promise<Buffer> {
	if (typeof(url) !== "string") {
		return Promise.reject("Invalid Url");
	}
	if (!url.match(/^https?:\/\//i)) {
		url = "https://" + url;
	}
	const protocol = getProtocol(url);
	const method = postData ? "request" : "get";
	const payload = postData ? JSON.stringify(postData) : null;
	return new Promise((resolve, reject) => {
		try {
			const options = payload ? {
				headers: {
					'Content-Type': 'application/json',
					'Content-Length': payload.length,
				},
				method: "POST"
			} : { };
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
				req.write(payload);
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

/** Convenience wrapper for getText(url).then(text => JSON.parse(text)) */
export function getJson<T = any>(url: string): Promise<T>;
export function getJson<T = any, U = any>(url: string, postData: U): Promise<T>;
export function getJson<T = any, U = any>(url: string, postData?: U): Promise<T> {
	return new Promise((resolve, reject) => {
		getText(url, postData).then(text => {
			try {
				resolve(JSON.parse(text));
			}catch(ex) {
				reject(ex);
			}
		}, reject);
	});
}
