import type { CheckField, PageJson } from "../types.js";

/**
 * @internal
 * Reads the PDF json and returns all of the checkbox fields.
 */
export function collectCheckFields(page: PageJson): CheckField[] {
	const fields: CheckField[] = [];
	const checkFields = page.Boxsets ?? [];
	checkFields.forEach(field => {
		if (Array.isArray(field.boxes)) {
			field.boxes.forEach(box => {
				if (box.T?.Name === "box") {
					const name = (box.id?.Id ?? "").trim();
					const checked = box.checked === true;
					if (name) {
						fields.push({ name, checked });
					}
				}
			});
		}
	});
	return fields;
}