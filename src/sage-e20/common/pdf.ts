import type { Optional } from "@rsc-utils/type-utils";
import { isBlank } from "../../sage-utils/utils/StringUtils";

export type TTextField = { name:string; value:string; };
export type TCheckField = { name:string; checked:boolean; };
export type TField = TTextField | TCheckField;

/** Reads the E20 character sheet json and returns all of the textbox fields. */
function collectTextFields(page: TPageJson): TTextField[] {
	const fields: TTextField[] = [];
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

/** Reads the E20 character sheet json and returns all of the checkbox fields. */
function collectCheckFields(page: TPageJson): TCheckField[] {
	const fields: TCheckField[] = [];
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

type TFieldJson = { id?:{ Id:string; }; T?:{ Name:string; }; V?:string; };
type TBoxsetJson = { boxes:{ id?:{ Id:string; }; T?:{ Name:string; }; checked?:boolean; }[]; };
type TPageJson = { Fields:TFieldJson[]; Boxsets:TBoxsetJson[]; Texts:{ R?:{ T:string; }[]; }[]; };
export type TRawJson = { Pages:TPageJson[]; Meta?:{ Title?:string; }; };
function collectFields(json: Optional<TRawJson>): TField[] {
	const fields: TField[] = [];
	const pages = json?.Pages ?? [];
	pages.forEach(page => {
		fields.push(...collectTextFields(page));
		fields.push(...collectCheckFields(page));
	});
	return fields;
}

/** returns a non-blank string or undefined */
function stringOrUndefined(value: Optional<string>): string | undefined {
	return isBlank(value) ? undefined : value;
}

export class PdfJsonFields {
	public constructor(private fields: TField[]) { }

	/** returns the given field by matching the name */
	public find<T extends TField>(name: string): T | undefined {
		return this.fields.find(field => field.name === name) as T;
	}

	/** finds the given field and returns true if the field is checked. Also removes the field from the fields array. */
	public findChecked(name: string): boolean {
		const field = this.find<TCheckField>(name);
		this.removeField(field);
		return field?.checked === true;
	}

	/** finds the given field and returns the value as a non-blank string or undefined */
	public findValue(name: string): string | undefined {
		const field = this.find<TTextField>(name);
		this.removeField(field);
		return stringOrUndefined(field?.value);
	}

	private removeField(field: Optional<TField>): void {
		if (field) {
			const fieldIndex = this.fields.indexOf(field);
			if (fieldIndex > -1) {
				this.fields.splice(fieldIndex, 1);
			}
		}
	}

	public static inputToFields(input: any): TField[] {
		const json: TRawJson = input;
		return collectFields(json);
	}

}