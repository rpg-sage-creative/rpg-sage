import { isNotBlank } from "@rsc-utils/core-utils";
import { isSimpleObject } from "../../validation/typeGuard/isSimpleObject.js";

export type Alias = {
	name: string;
	target: string;
};

export function isAlias(alias: unknown): alias is Alias {
	return isSimpleObject(alias)
		&& Object.keys(alias).length === 2
		&& isNotBlank(alias.name)
		&& isNotBlank(alias.target);
}