import { stringOrUndefined } from "../../string/index.js";
import type { Optional } from "../../types/generics.js";
import { isDefined } from "../../types/index.js";

type Options = {
	/** default: "," */
	splitter?: string | RegExp;
	/** default: stringOrUndefined */
	mapper?: (value: string) => Optional<string>;
	/** default: isDefined */
	filter?: (value: Optional<string>) => value is string;
};

export function stringArrayOrEmpty(value: Optional<string>, opts?: Options): string[] {
	const { splitter = ",", mapper = stringOrUndefined, filter = isDefined } = opts ?? {};
	return value?.split(splitter).map(mapper).filter(filter)?? [];
}