import { stringify } from "../json/bigint/stringify.js";

type ErrorLike = {
	message: string;
	name: string;
	stack: string;
};

function isErrorLike(arg: any): arg is ErrorLike {
	if (arg) {
		if (arg instanceof Error) {
			return true;
		}
		const type = Object.prototype.toString.call(arg);
		if (type === "[object Error]") {
			return true;
		}
		if (type === "[object Object]") {
			return ["message", "name", "stack"].some(key => key in arg);
		}
	}
	return false;
}

/** Logging helper for formatting Error objects. */
export function formatArg(arg: any): string {
	if (isErrorLike(arg)) {
		const message = [arg.name, arg.message].filter(s => s).join(": ");
		return [message, arg.stack].filter(s => s).join("\n");
	}
	const asString = String(arg);
	if (!asString.startsWith("[object")) {
		return asString;
	}
	return stringify(arg);
}