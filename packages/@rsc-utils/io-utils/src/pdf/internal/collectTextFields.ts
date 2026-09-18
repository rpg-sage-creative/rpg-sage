import type { PageJson, TextField } from "../types.js";

/**
 * @internal
 * Reads the PDF json and returns all of the textbox fields.
 */
export function collectTextFields(page: PageJson): TextField[] {
	const fields: TextField[] = [];
	const textFields = page.Fields ?? [];
	textFields.forEach(field => {
		if (field.T?.Name === "alpha") {
			const name = (field.id?.Id ?? "").trim();
			const value = (field.V ?? "").trim();
			if (name) {
				fields.push({ name, value });
			}
		}
	});
	return fields;
}