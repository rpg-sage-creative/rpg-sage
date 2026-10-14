import { levels } from "pino";

/** Reusable logic to convert the given value to a level label (or undefined). */
export function toHumanReadableLevel(value: unknown): string | undefined {
	switch(typeof(value)) {
		case "string": return value in levels.values ? value : undefined;
		case "number": return levels.labels[value];
		default: return undefined;
	}
}