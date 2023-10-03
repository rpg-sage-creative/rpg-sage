import { verbose } from "../ConsoleUtils";
import { getText } from "./getText.js";

/** Convenience wrapper for getText(url).then(text => JSON.parse(text)) */
export function getJson<T = any>(url: string): Promise<T>;
export function getJson<T = any, U = any>(url: string, postData: U): Promise<T>;
export function getJson<T = any, U = any>(url: string, postData?: U): Promise<T> {
	return new Promise((resolve, reject) => {
		getText(url, postData).then(text => {
			try {
				resolve(JSON.parse(text));
			}catch(ex) {
				if (text === "Internal Server Error") {
					reject(text);
				}else {
					verbose(text);
					reject(ex);
				}
			}
		}, reject);
	});
}