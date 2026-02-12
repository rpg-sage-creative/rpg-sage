import { isNotBlank } from "@rsc-utils/core-utils";
import { isSimpleObject } from "./index.js";

export type AliasV1 = {
	name: string;
	target: string;
};

export type Alias = AliasV1;

export function isAlias(alias: unknown): alias is Alias {
	return isSimpleObject(alias)
		&& isNotBlank(alias.name)
		&& isNotBlank(alias.target);
}