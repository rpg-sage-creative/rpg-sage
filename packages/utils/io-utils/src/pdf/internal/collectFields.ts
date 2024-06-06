import { collectCheckFields } from "./collectCheckFields.js";
import { collectTextFields } from "./collectTextFields.js";
import type { Field, Optional, RawJson } from "./types.js";

/** @internal */
export function collectFields(json: Optional<RawJson>): Field[] {
	const fields: Field[] = [];
	const pages = json?.Pages ?? [];
	pages.forEach(page => {
		fields.push(...collectTextFields(page));
		fields.push(...collectCheckFields(page));
	});
	return fields;
}