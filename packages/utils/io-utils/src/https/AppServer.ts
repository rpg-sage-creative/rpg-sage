import { error, info, stringify, verbose } from "@rsc-utils/core-utils";
import { createServer, type IncomingMessage, type Server } from "http";
import type { BufferHandler, BufferHandlerJsonError, BufferHandlerResponse } from "./types.js";

/** Logs via error() and then returns a 500 error. */
function errorReturn500(ex: any): BufferHandlerResponse<BufferHandlerJsonError> {
	error(ex);
	return {
		statusCode: 500,
		contentType: "application/json",
		body: { error:"Unknown Error" }
	};
}

/** Makes sure the output is a Buffer or string. */
function ensureOutput<T>(output: T): Buffer | string {
	if (output === null || output === undefined) {
		return stringify({ error:"null or undefined output" });
	}
	if (Buffer.isBuffer(output)) {
		return output;
	}
	if (typeof(output) === "string") {
		return output;
	}
	return stringify(output);
}

/**
 * A simple, reusable app server for offloading tasks from a process.
 */
export class AppServer<T> {
	public constructor(public name: string, public handler: BufferHandler<T>) { }

	protected log(level: "info" | "verbose", ...args: (IncomingMessage | string)[]): void {
		const req = args.find(arg => typeof(arg) !== "string") as IncomingMessage | undefined;
		const ev = args.find(arg => typeof(arg) === "string") as string | undefined;
		const url = req ? `("${req.url}")` : ``;
		const dot = ev ? `.` : ``;
		const msg = ev ?? "";
		const fn = level === "info" ? info : verbose;
		fn(level, `AppServer<${this.name}>${url}${dot}${msg}`);
	}

	protected verbose(ev: string): void;
	protected verbose(req: IncomingMessage): void;
	protected verbose(req: IncomingMessage, ev: string): void;
	protected verbose(...args: (IncomingMessage | string)[]): void {
		this.log("verbose", ...args);
	}

	public server?: Server;
	public create(): this {
		if (this.server) {
			return this;
		}
		this.server = createServer((req, res) => {
			this.verbose(req);
			if (req.method === "POST") {
				const chunks: Buffer[] = [];
				req.on("data", (chunk: Buffer) => {
					this.verbose(req, `on("data")`);
					chunks.push(chunk);
				});
				req.once("end", (async () => {
					this.verbose(req, `once("end")`);
					const buffer = Buffer.concat(chunks);
					const handlerResponse = await this.handler(buffer).catch(errorReturn500);
					res.writeHead(handlerResponse.statusCode, { 'Content-type':handlerResponse.contentType });
					res.end(ensureOutput(handlerResponse.body));
					this.verbose(req, `once("end").res.end(${handlerResponse.statusCode})`);
				}) as () => void);
			}else {
				res.writeHead(405, { 'Content-type':'application/json' });
				res.write(stringify({ error: "Method not allowed!" }));
				res.end();
				this.verbose(req, `res.end(405)`);
			}
		});
		return this;
	}

	public port?: number;
	public listen(port: number): this {
		if (this.port) {
			return this;
		}
		this.create();
		this.port = port;
		this.server?.listen(port);
		this.log("info", `listen(${port})`);
		return this;
	}

	public static start<T>(name: string, port: number, handler: BufferHandler<T>): AppServer<T> {
		return new AppServer(name, handler).listen(port);
	}
}