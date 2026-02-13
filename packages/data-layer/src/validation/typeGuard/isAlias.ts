import { isNotBlank } from "@rsc-utils/core-utils";
import type { Alias } from "../../types/index.js";
import { isSimpleObject } from "./index.js";

export function isAlias(alias: unknown): alias is Alias {
	return isSimpleObject(alias)
		&& isNotBlank(alias.name)
		&& isNotBlank(alias.target);
}