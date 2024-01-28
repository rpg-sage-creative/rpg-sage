import type { Optional } from "@rsc-utils/type-utils";
import { collectCheckFields } from "./collectCheckFields.js";
import { collectTextFields } from "./collectTextFields.js";
import type { Field, RawJson } from "./types.js";

/**
 * @internal
 * @private
 */
export function collectFields(json: Optional<RawJson>): Field[] {
	const fields: Field[] = [];
	const pages = json?.Pages ?? [];
	pages.forEach(page => {
		fields.push(...collectTextFields(page));
		fields.push(...collectCheckFields(page));
	});
	return fields;
}