import { typeError, verbose, type Optional, type ProgressTracker } from "@rsc-utils/core-utils";
import type { FollowResponse, RedirectableRequest } from "follow-redirects";
import type { IncomingMessage } from "node:http";
import { WriteStream, createWriteStream, existsSync, mkdirSync, rmSync, statSync } from "node:fs";
import { dirname } from "node:path";
import { pipeline } from "node:stream";
import { createGunzip, type Gunzip } from "node:zlib";
import { createHttpLogger } from "./createHttpLogger.js";
import { getProtocol } from "./getProtocol.js";

type Opts = {
	logPercent?: boolean;
	progressTracker?: ProgressTracker;
	/** milliseconds */
	timeout?: number;
};

type Options = Opts & {
	url: string;
	filePath: string;
};

/**
 * Reads a file from the given url and stores it using the given filePath.
 * Returns false if errors occur, true otherwise.
 */
export function cacheFile(url: string, filePath: string): Promise<boolean>;
export function cacheFile(url: string, filePath: string, options: Opts): Promise<boolean>;
export function cacheFile(options: Options): Promise<boolean>;
export function cacheFile(...args: (string | Opts)[]): Promise<boolean> {
	const opts: Partial<Options> | undefined = typeof(args[args.length - 1]) !== "string"
		? args.pop() as Options | undefined
		: undefined;

	const url = opts?.url ?? args.shift() as string;
	if (typeof(url) !== "string") {
		return Promise.reject(typeError({ argKey:"url", mustBe:"a valid url string", value:url }));
	}

	const filePath = opts?.filePath ?? args.shift();
	if (typeof(filePath) !== "string") {
		return Promise.reject(typeError({ argKey:"filePath", mustBe:"a valid url path string", value:filePath }));
	}

	try {

		const dirPath = dirname(filePath);

		if (!existsSync(dirPath)) {

			verbose(`Creating folder: ${dirPath}`);
			mkdirSync(dirPath, { recursive:true });

		}else if (existsSync(filePath)) {

			verbose(`Removing old file: ${filePath}`);
			rmSync(filePath);

		}

	}catch(ex) {
		return Promise.reject(ex);
	}

	const { promise, reject:__reject, resolve:__resolve } = Promise.withResolvers<boolean>();

	// declare all objects that should be cleaned up before resolving/rejecting
	let request: Optional<RedirectableRequest<any, any>>;
	let response: Optional<Response>;
	let readStream: Optional<ReadStream>;
	let writeStream: Optional<WriteStream>;
	let progressTracker = opts?.logPercent || opts?.progressTracker
		? opts.progressTracker ?? createHttpLogger(`Fetching Bytes: ${url}`, 0)
		: null;

	// we need to cleanup resources regardless of resolve vs reject
	const cleanup = () => {
		//#region readStream cleanup
		writeStream?.removeAllListeners();
		writeStream?.destroy();
		writeStream = null;
		//#endregion

		//#region readStream cleanup
		readStream?.removeAllListeners();
		readStream?.destroy();
		readStream = null;
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

	const resolve = () => {
		cleanup();
		__resolve(true);
	};

	const reject = (ev: string, msg: any) => {
		cleanup();
		__reject(msg ?? ev);
	};

	try {

		const options = {
			headers: {
				"Accept-Encoding": "gzip",
			},
			method: "GET",
		};

		request = getProtocol(url).get(url, options, _response => {
			response = _response;
			({ readStream, writeStream } = processResponse({ filePath, response, resolve, reject, progressTracker }));
		});

		if (opts?.timeout) {
			request.setTimeout(opts.timeout);
		}

		request.once("close", err => reject("request.close", err));
		request.once("error", err => reject("request.error", err));
		request.once("timeout", err => reject("request.timeout", err));

		request.end();

	}catch(ex) {
		reject("try/catch (request)", ex);
	}

	return promise;
}

type Response = IncomingMessage & FollowResponse;
type ReadStream = (IncomingMessage & FollowResponse) | Gunzip;

type ProcessResponseArgs = {
	filePath: string;
	response: Response;
	resolve: () => void;
	reject: (ev: string, err: unknown) => void;
	progressTracker: Optional<ProgressTracker>;
};

type ProcessResponseResults = {
	readStream?: Optional<ReadStream>;
	writeStream?: Optional<WriteStream>;
};

/**
 * Reads all the data from the given response.
 * If the encoding is gzip, then a separate stream is created using gunzip.
 * The stream is returned so that it can be cleaned up by errors outside the response.
 * @returns the original Response or a new gunzip Stream
 */
function processResponse({ filePath, response, resolve, reject, progressTracker }: ProcessResponseArgs): ProcessResponseResults {
	let readStream: Optional<ReadStream>;
	let writeStream: Optional<WriteStream>;

	try {
		if ("content-length" in response.headers) {
			const contentLength = +(response.headers["content-length"] ?? 0);
			progressTracker?.start(contentLength);
		}

		// create the stream based on content encoding
		readStream = response.headers["content-encoding"] === "gzip"
			// if content is encoded as gzip, we need a gunzip stream
			? pipeline(response, createGunzip(), err => err ? reject("readStream.gunzip", err) : void(0))
			// otherwise just use the response as is
			: response;

		// this destroys writeStream too early, don't use
		// readStream.once("close", (err: any) =>
		// 	reject("readStream.close", err)
		// );

		readStream.on("data", (rChunk: Buffer) => {
			if (progressTracker?.started) {
				progressTracker?.increment(rChunk.byteLength);
			}
		});

		// this destroys writeStream too early, don't use
		// readStream.once("end", () => {
		// 	if (existsSync(filePath)) {
		// 		resolve();
		// 	}else {
		// 		reject("readStream.end", "no file created");
		// 	}
		// });

		readStream.once("error", (err: any) =>
			reject("readStream.error", err)
		);

		verbose(`Opening file for stream: ${filePath}`);

		writeStream = createWriteStream(filePath, { encoding:"utf8" });

		writeStream.once("close", () => {
			if (existsSync(filePath)) {
				const fileSize = statSync(filePath).size;
				if (fileSize > 0) {
					resolve();
				}else {
					reject("writeStream.close", `Destination file invalid: ${filePath} (${fileSize})`);
				}
			}else {
				reject("writeStream.close", `Destination file not created: ${filePath}`);
			}
		});

		writeStream.once("error", (err: any) =>
			reject("writeStream.error", err)
		);

		readStream.pipe(writeStream);

	}catch(ex) {
		reject("try/catch (processResponse)", ex);

	}

	return { readStream, writeStream };
}