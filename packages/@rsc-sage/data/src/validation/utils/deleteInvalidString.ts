import { isValidString } from "../index.js";

export function deleteInvalidString<Core extends Record<string, any>, Key extends keyof Core>({ core, key, regex }: { core:Core; key:Key; regex?:RegExp }): void {
	if (!isValidString(core[key])) delete core[key];
	if (core[key] && regex && !regex.test(core[key])) delete core[key];
}