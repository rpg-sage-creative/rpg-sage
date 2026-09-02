import { isUrl } from "@rsc-utils/io-utils";

export function deleteInvalidUrl<Core extends Record<string, any>, Key extends keyof Core>({ core, key }: { core:Core; key:Key; }): void {
	if (!isUrl(core[key])) delete core[key];
}