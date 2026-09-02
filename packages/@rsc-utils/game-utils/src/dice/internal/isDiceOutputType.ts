import { DiceOutputType } from "@rsc-sage/data-layer";

/** @internal */
export function isDiceOutputType(value: unknown): value is DiceOutputType {
	return typeof(value) === "number" && DiceOutputType[value] !== undefined;
}