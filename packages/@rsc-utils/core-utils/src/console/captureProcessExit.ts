import type { Awaitable } from "@rsc-utils/type-utils";
import { error } from "./loggers/error.js";
import { info } from "./loggers/info.js";

type SignalEventName =
	/** interrupt from keyboard (such as Ctrl+C): do normal shutdown and cleanup processes */
	"SIGINT"
	/** quit from keyboard: often considered a debugging exit (as in leave temp files or write data dumps to logs) */
	| "SIGQUIT"
	/** Termination signal: do normal shutdown and cleanup processes */
	| "SIGTERM"
	/** Hangup detected on controlling terminal or death of controlling process: ?? */
	| "SIGHUP";

async function onSignal(eventName: SignalEventName, code?: number): Promise<void> {
	try {
		// log the event
		info(`process.on("${eventName}") = ${code}`);

		// if we don't have handlers, just exit
		if (!signalHandlers?.size && !destroyables) {
			process.exit(code);
		}

		// setup the exitCode
		let exitCode = 0;
		const exitHandler = (err: any) => {
			error(err);
			exitCode = 1;
		};

		// if we have destroyables, send the event
		if (destroyables) {
			for (const destroyable of destroyables) {
				try {
					await Promise.resolve(destroyable.destroy()).catch(exitHandler);
				}catch(ex) {
					exitHandler(ex);
				}
			}
			destroyables.clear();
			destroyables = undefined;
		}

		// if we have handlers, send the event
		if (signalHandlers) {
			for (const handler of signalHandlers) {
				try {
					await Promise.resolve(handler(eventName, code)).catch(exitHandler);
				}catch(ex) {
					exitHandler(ex);
				}
			}
			signalHandlers.clear();
			signalHandlers = undefined;
		}

		// send exit code
		process.exit(exitCode);

	}catch(outer) {
		error(outer);
		process.exit(1);
	}
}

let captured = false;

type Destroyable = { destroy:() => Awaitable<void>; };
let destroyables: Set<Destroyable> | undefined;

type SignalHandler = (eventName: SignalEventName, code?: number) => Awaitable<void>;
let signalHandlers: Set<SignalHandler> | undefined;

/** Captures SIGINT events to log them before exiting the process. */
export function captureProcessExit(): void;

/**
 * Captures SIGINT events to log them and call destroy() on the given destroyable before exiting the process.
 * The process will exit with code 0 if no listener threw an error.
 */
export function captureProcessExit(destroyable: Destroyable): void;

/**
 * Captures SIGINT events to log them and pass to the given handler before exiting the process.
 * The process will exit with code 0 if no listener threw an error.
 */
export function captureProcessExit(signalHandler: SignalHandler): void;

export function captureProcessExit(arg?: Destroyable | SignalHandler): void {
	if (arg) {
		if (typeof(arg) === "function") {
			(signalHandlers ??= new Set()).add(arg);

		}else if (typeof(arg.destroy) === "function") {
			(destroyables ??= new Set()).add(arg);
		}
	}

	if (!captured) {
		process.on("SIGINT", onSignal);
		captured = true;
	}
}