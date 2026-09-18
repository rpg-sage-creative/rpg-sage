import { typeError, verbose, type Optional } from "@rsc-utils/core-utils";
import { getProtocol } from "./getProtocol.js";
import type { FollowResponse, RedirectableRequest } from "follow-redirects";
import type { IncomingMessage } from "node:http";

type Response = IncomingMessage & FollowResponse;

/**
 * Attempts to get the file size (content-length) from a url.
 * Returns the number of bytes, or rejects if an error occurs.
 */
export function getFileSize(url: string): Promise<number> {
	if (typeof(url) !== "string") {
		return Promise.reject(typeError({ argKey:"url", mustBe:"a valid url string", value:url }));
	}

	const { promise, reject:__reject, resolve:__resolve } = Promise.withResolvers<number>();

	// declare all objects that should be cleaned up before resolving/rejecting
	let request: Optional<RedirectableRequest<any, any>>;
	let response: Optional<Response>;

	// we need to cleanup resources regardless of resolve vs reject
	const cleanup = () => {

		//#region response cleanup
		response?.removeAllListeners();
		response?.destroy();
		response = null;
		//#endregion

		//#region request cleanup
		request?.removeAllListeners();
		request?.destroy();
		request = null;
		//#endregion

	};

	const resolve = (contentLength: number) => {
		cleanup();
		__resolve(contentLength);
	};

	const reject = (ev: string, msg: any) => {
		cleanup();
		__reject(msg ?? ev);
	};

	try {

		const protocol = getProtocol(url);
		const options = { method:"HEAD" };

		verbose(`${options.method} ${url}`);

		request = protocol.request(url, options, _response => {
			response = _response;

			try {

				const stringValue = response.headers["content-length"];
				const numberValue = stringValue ? +stringValue : -1;
				const contentLength = isNaN(numberValue) ? -1 : numberValue;
				resolve(contentLength);

			}catch(ex) {
				reject("try/catch (createStreamFromResponse)", ex);
			}
		});
		request.once("error", reject);
		request.end();

	}catch(ex) {
		reject("try/catch (request)", ex);
	}

	return promise;
}