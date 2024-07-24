import { stringify, verbose } from "@rsc-utils/core-utils";
import type { ProgressTracker } from "@rsc-utils/progress-utils";
import { fileExistsSync } from "../fs/fileExistsSync.js";
import { readFile } from "../fs/readFile.js";
import { createHttpLogger } from "./createHttpLogger.js";
import { getProtocol } from "./getProtocol.js";

type Opts = { progressTracker?:ProgressTracker; logPercent?:boolean; };

/**
 * You can pass in a fully formed url or leave off the protocol and allow it to prepend "https://".
 * If you pass in a url with "http://" it will downgrade to use http protocol instead of https.
*/
export function getBuffer(url: string): Promise<Buffer>;

/**
 * You can pass in a fully formed url or leave off the protocol and allow it to prepend "https://".
 * If you pass in a url with "http://" it will downgrade to use http protocol instead of https.
 * Sending postData will stringify the value and then do a POST instead of a GET.
*/
export function getBuffer<T = any>(url: string, postData: T): Promise<Buffer>;

export function getBuffer<T = any>(url: string, postData?: T, opts?: Opts): Promise<Buffer> {
	if (typeof(url) !== "string") {
		return Promise.reject(new Error("Invalid Url"));
	}
	if (/^file:\/\//i.test(url)) {
		const path = url.slice(6);
		if (fileExistsSync(path)) {
			return readFile(path);
		}else {
			return Promise.reject(new Error("Invalid Path"));
		}
	}
	if (!(/^https?:\/\//i).test(url)) {
		url = "https://" + url;
	}
	return new Promise((_resolve, _reject) => {
		let pTracker = opts?.logPercent || opts?.progressTracker ? opts.progressTracker ?? createHttpLogger(`Fetching Bytes: ${url}`, 0) : null;
		const resolve = (buffer: Buffer) => {
			pTracker?.finish();
			pTracker = null;
			_resolve(buffer);
		};
		const reject = (msg: any) => {
			pTracker?.error(msg);
			pTracker = null;
			_reject(msg);
		};
		try {
			const protocol = getProtocol(url);
			const method = postData ? "request" : "get";
			const payload = postData ? stringify(postData) : null;
					const options = payload ? {
				headers: {
					'Content-Type': 'application/json',
					'Content-Length': payload.length,
				},
				method: "POST"
			} : { };
			verbose(`${options?.method ?? "GET"} ${url}`);
			if (options) {
				verbose({options});
			}
			if (postData) {
				verbose({postData});
			}

			const req = protocol[method](url, options, response => {
				try {
					const chunks: Buffer[] = [];
					response.on("data", (chunk: Buffer) => {
						pTracker?.increment(chunk.byteLength);
						chunks.push(chunk);
					});
					response.once("close", reject);
					response.once("end", () => resolve(Buffer.concat(chunks)));
					response.once("error", reject);
				}catch(ex) {
					reject(ex);
				}
			});
			req.once("response", resp => pTracker?.start(+(resp.headers["content-length"] ?? 0)));
			req.once("close", reject);
			req.once("error", reject);
			req.once("timeout", reject);
			if (method === "request") {
				req.write(payload);
			}
			/** @todo do I need this req.end() ??? */
			req.end();
		}catch(ex) {
			reject(ex);
		}
	});
}
