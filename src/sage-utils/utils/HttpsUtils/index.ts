import * as http from "http";
import * as https from "https";

/**
 * You can pass in a fully formed url or leave off the protocol and allow it to prepend "https://".
 * If you pass in a url with "http://" it will downgrade to use http protocol instead of https.
*/
export function getText(url: string): Promise<string> {
	if (typeof(url) !== "string") {
		return Promise.reject("Invalid Url");
	}
	if (!url.match(/^https?:\/\//i)) {
		url = "https://" + url;
	}
	const protocol = url.match(/^http:\/\//i) ? http : https;
	return new Promise((resolve, reject) => {
		try {
			const get = protocol.get(url, response => {
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
			get.once("close", reject);
			get.once("error", reject);
			get.once("timeout", reject);
		}catch(ex) {
			reject(ex);
		}
	});
}

/** Convenience wrapper for getText(url).then(text => JSON.parse(text)) */
export function getJson<T = any>(url: string): Promise<T> {
	return new Promise((resolve, reject) => {
		getText(url).then(text => {
			try {
				resolve(JSON.parse(text));
			}catch(ex) {
				reject(ex);
			}
		}, reject);
	});
}
