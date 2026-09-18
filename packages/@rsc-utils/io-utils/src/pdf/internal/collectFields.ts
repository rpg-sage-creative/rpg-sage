import type { Optional } from "@rsc-utils/core-utils";
import type { Field, PdfJson } from "../types.js";
import { collectCheckFields } from "./collectCheckFields.js";
import { collectTextFields } from "./collectTextFields.js";

/** @internal */
export function collectFields(json: Optional<PdfJson>): Field[] {
	const fields: Field[] = [];
	const pages = json?.Pages ?? [];
	pages.forEach(page => {
		const textFields = collectTextFields(page);
		textFields.forEach(field => fields.push(field));

		const checkFields = collectCheckFields(page);
		checkFields.forEach(field => fields.push(field));
	});
	return fields;
}