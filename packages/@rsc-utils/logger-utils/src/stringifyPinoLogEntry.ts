import { stringifyJson } from "@rsc-utils/json-utils";
import { isErrorLike, type ErrorLike } from "@rsc-utils/error-utils";
import { levels } from "pino";

type PinoLogEntry = {
	err?: ErrorLike;
	level: number;
	msg?: string;
};

function isPinoLogEntry(entry: unknown): entry is PinoLogEntry {
	return typeof(entry) === "object" && entry !== null
		&& "level" in entry && typeof(entry.level) === "number"
		&& (!("err" in entry) || isErrorLike(entry.err))
		&& (!("msg" in entry) || typeof(entry.msg) === "string")
		;
}

/** Logging helper for formatting logged objects. */
export function stringifyPinoLogEntry(entry: unknown, maxLineLength = 80): string {

	if (isPinoLogEntry(entry)) {
		const lines: string[] = [];

		lines.push(`Log Level: ${levels.labels[entry.level]}`);

		if (entry.msg) {
			lines.push("", "Message", "-------", entry.msg);
		}

		if (entry.err) {
			lines.push("", "Error", "-------");

			const { name, message, stack } = entry.err;

			if (name || message) {
				lines.push([entry.err.name, entry.err.message].filter(s => s).join(": "));
			}

			if (stack) {
				lines.push(stack);
			}
		}

		lines.push("", "Raw", "-------");

		stringifyJson(entry, undefined, undefined, maxLineLength)
			.split("\n")
			.forEach(line => lines.push(line));

		return lines.join("\n");
	}

	// stringify the object
	return stringifyJson(entry, undefined, undefined, maxLineLength);

}