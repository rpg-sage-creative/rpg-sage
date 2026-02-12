import { isEmptyArray } from "./isEmptyArray.js";

export function deleteEmptyArray<Core extends Record<string, any>, Key extends keyof Core>({ core, key }: { core:Core; key:Key; }): void {
	if (isEmptyArray(core[key])) delete core[key];
}