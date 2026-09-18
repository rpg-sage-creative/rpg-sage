import { stringifyJson, typeError, verbose, type Optional, type ProgressTracker } from "@rsc-utils/core-utils";
import type { FollowResponse, RedirectableRequest } from "follow-redirects";
import type { IncomingMessage } from "node:http";
import { pipeline } from "node:stream";
import { createBrotliDecompress, createGunzip, type Gunzip } from "node:zlib";
import { fileExists } from "../fs/fileExists.js";
import { readFile } from "../fs/readFile.js";
import { createHttpLogger } from "./createHttpLogger.js";
import { getProtocol } from "./getProtocol.js";

type Response = IncomingMessage | (IncomingMessage & FollowResponse);
type Stream = IncomingMessage | (IncomingMessage & FollowResponse) | Gunzip;

export type GetBufferOpts = {
	/** defaults to true */
	followRedirects?: boolean;
	headers?: Record<string, string>;
	/** defaults to false */
	logPercent?: boolean;
	progressTracker?: ProgressTracker;
	/** milliseconds; defaults to no timeout */
	timeout?: number;
};

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
export function getBuffer<T = any>(url: string, postData: T, opts?: GetBufferOpts): Promise<Buffer>;

export function getBuffer<T = any>(url: string, postData?: T, opts?: GetBufferOpts): Promise<Buffer> {
	if (typeof(url) !== "string") {
		return Promise.reject(typeError({ argKey:"url", mustBe:"a valid url string", value:url }));
	}

	const urlLower = url.toLowerCase();

	// we don't need to use the request logic for file reads
	if (urlLower.startsWith("file://")) {
		const path = url.slice(7);
		return fileExists(path).then(
			exists => exists ? readFile(path) : Promise.reject(new Error("Invalid Path: " + url)),
			reason => Promise.reject(reason ?? new Error("Invalid Path: " + url))
		);
	}

	// make sure the url starts with http:// or https://
	if (!(urlLower.startsWith("http://") || urlLower.startsWith("https://"))) {
		url = "https://" + url;
	}

	const { promise, reject:__reject, resolve:__resolve } = Promise.withResolvers<Buffer>();

	// declare all objects that should be cleaned up before resolving/rejecting
	let request: Optional<RedirectableRequest<any, any>>;
	let response: Optional<Response>;
	let stream: Optional<Stream>;
	let progressTracker = opts?.logPercent || opts?.progressTracker
		? opts.progressTracker ?? createHttpLogger(`Fetching Bytes: ${url}`, 0)
		: null;

	// we need to cleanup resources regardless of resolve vs reject
	const cleanup = () => {
		//#region stream cleanup
		stream?.removeAllListeners();
		stream?.destroy();
		stream = null;
		//#endregion

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

		//#region progress tracker cleanup
		if (progressTracker?.started) {
			progressTracker?.finish();
		}
		progressTracker = null;
		//#endregion
	};

	const resolve = (buffer: Buffer) => {
		cleanup();
		__resolve(buffer);
	};

	const reject = (ev: string, msg: any) => {
		cleanup();
		__reject(msg ?? `${ev}: ${url}`);
	};

	try {

		const protocol = getProtocol(url, opts?.followRedirects as false);
		const payload = postData ? stringifyJson(postData) : null;
		const options = payload ? {
			headers: {
				"Accept-Encoding": "gzip, br",
				"Content-Length": payload.length,
				"Content-Type": "application/json",
				...opts?.headers,
			},
			method: "POST"
		} : {
			headers: {
				"Accept": "*/*",
				"Accept-Encoding": "gzip, br",
				"User-Agent": "RPG Sage Discord Bot - rpgsage.app",
				...opts?.headers,
			},
			method: "GET"
		};

		verbose(`${options.method} ${url}`);
		if (options) {
			verbose({options});
		}
		if (postData) {
			verbose({postData});
		}

		const functionName = postData ? "request" : "get";
		request = protocol[functionName](url, options, _response => {
			response = _response;
			stream = processResponse({ response, resolve, reject, progressTracker });
		});

		if (opts?.timeout) {
			request.setTimeout(opts.timeout);
		}

		request.once("close", err => reject("request.close", err));
		request.once("error", err => reject("request.error", err));
		request.once("timeout", err => reject("request.timeout", err));

		if (payload) {
			request.write(payload);
		}

		/** @todo do I need this request.end() ??? */
		request.end();

	}catch(ex) {
		reject("try/catch (request)", ex);
	}

	return promise;
}

type ProcessResponseArgs = {
	response: Response;
	resolve: (buffer: Buffer) => void;
	reject: (ev: string, err: unknown) => void;
	progressTracker: Optional<ProgressTracker>;
}

/**
 * Reads all the data from the given response.
 * If the encoding is gzip, then a separate stream is created using gunzip.
 * The stream is returned so that it can be cleaned up by errors outside the response.
 * @returns the original Response or a new gunzip Stream
 */
function processResponse({ response, resolve, reject, progressTracker }: ProcessResponseArgs): Stream | undefined {
	let stream: Stream | undefined;

	try {
		let rChunks: Buffer[] | null = [];

		if ("content-length" in response.headers) {
			const contentLength = +(response.headers["content-length"] ?? 0);
			progressTracker?.start(contentLength);
		}

		// create the stream based on content encoding
		stream = createStream(response, reject);

		stream.once("close", (err: any) =>
			reject("stream.close", err)
		);

		stream.on("data", (rChunk: Buffer) => {
			if (progressTracker?.started) {
				progressTracker?.increment(rChunk.byteLength);
			}
			rChunks?.push(rChunk);
		});

		stream.once("end", () => {
			if (rChunks?.length) {
				const buffer = Buffer.concat(rChunks);
				rChunks = null;
				resolve(buffer);
			}else {
				rChunks = null;
				reject("stream.end", "empty buffer");
			}
		});

		stream.once("error", (err: any) =>
			reject("stream.error", err)
		);

	}catch(ex) {
		reject("try/catch (processResponse)", ex);

	}

	return stream;
}

/** Creates a stream appropriate to the content-encoding. */
function createStream(response: Response, reject: (ev: string, err: unknown) => void): Stream {
	const contentEncoding = response.headers["content-encoding"];

	// if content is encoded as gzip, we need a gunzip stream
	if (contentEncoding === "gzip") {
		return pipeline(
			response,
			createGunzip(),
			err => err ? reject("stream.gunzip", err) : void(0)
		);
	}

	// if content is encoded as br, we need a brotli stream
	if (contentEncoding === "br") {
		return pipeline(
			response,
			createBrotliDecompress(),
			err => err ? reject("stream.br", err) : void(0)
		)
	}

	// otherwise just use the response as is
	return response;
}