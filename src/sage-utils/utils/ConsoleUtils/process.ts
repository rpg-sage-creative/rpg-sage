import { error, info } from "./logger";

function onExit(code: number): void {
	info(`process.on("exit") = ${code}`);
}

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

		// setup the exitCode
		let exitCode = 0;
		const exitHandler = (err: any) => { error(err); exitCode = 1; };

		// if we have handlers, send the event
		if (signalHandlers) {
			// for of to allow await
			for (const handler of signalHandlers) {
				try {
					await Promise.resolve(handler(eventName, code)).catch(exitHandler);
				}catch(ex) {
					exitHandler(ex);
				}
			}
		}

		// send exit code
		process.exit(exitCode);

	}catch(outer) {
		error(outer);
		process.exit(1);
	}
}

let captured = false;

type SignalHandler = (eventName: SignalEventName, code?: number) => void | Promise<void>;

let signalHandlers: Set<SignalHandler>;

export function captureProcessExit(): void;
export function captureProcessExit(signalHandler: SignalHandler): void;
export function captureProcessExit(signalHandler?: SignalHandler): void {
	if (signalHandler) {
		if (!signalHandlers) signalHandlers = new Set();
		signalHandlers.add(signalHandler);
	}
	if (!captured) {
		process.on("exit", onExit);
		process.on("SIGINT", onSignal);
		captured = true;
	}
}