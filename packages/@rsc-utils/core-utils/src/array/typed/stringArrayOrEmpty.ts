import { isDefined, type Optional } from "@rsc-utils/type-utils";
import { stringOrUndefined } from "../../string/index.js";

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