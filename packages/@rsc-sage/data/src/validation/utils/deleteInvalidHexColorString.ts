import { isHexColorString } from "@rsc-utils/color-utils";

export function deleteInvalidHexColorString<Core extends Record<string, any>, Key extends keyof Core>({ core, key }: { core:Core; key:Key; }): void {
	if (!isHexColorString(core[key])) delete core[key];
}