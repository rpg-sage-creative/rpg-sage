import { isSimpleObject, isValidString } from "../../validation/index.js";

export type Alias = {
	name: string;
	target: string;
};

export function isAlias(alias: unknown): alias is Alias {
	return isSimpleObject(alias)
		&& Object.keys(alias).length === 2
		&& isValidString(alias.name)
		&& isValidString(alias.target);
}