import { parseJson, verbose } from "@rsc-utils/core-utils";
import { getText, type GetTextOpts } from "./getText.js";

type GetJsonOpts = GetTextOpts;

/** Convenience wrapper for getText(url).then(text => parse(text)) */
export function getJson<T = any>(url: string): Promise<T>;

export function getJson<T = any, U = any>(url: string, postData: U, opts?: GetJsonOpts): Promise<T>;

export function getJson<T = any, U = any>(url: string, postData?: U, opts?: GetJsonOpts): Promise<T> {
	return new Promise((resolve, reject) => {
		const options = { ...opts };
		options.headers = {
			"Accept": "application/json, */*",
			...options.headers
		};
		getText(url, postData, options).then(text => {
			try {
				resolve(parseJson(text));
			}catch(ex) {
				if (text === "Internal Server Error") {
					reject(text);
				}else {
					verbose(text?.slice(0, 50) + "...");
					reject(ex);
				}
			}
		}, reject);
	});
}