import { DiceOutputType } from "../types/DiceOutputType.js";

/** @internal */
export function isDiceOutputType(value: unknown): value is DiceOutputType {
	return typeof(value) === "number" && DiceOutputType[value] !== undefined;
}