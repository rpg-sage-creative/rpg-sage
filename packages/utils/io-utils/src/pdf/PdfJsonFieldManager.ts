import type { Optional } from "@rsc-utils/core-utils";
import { collectFields } from "./internal/collectFields.js";
import type { CheckField, Field, TextField } from "./internal/types.js";
import type { PdfJson } from "./types.js";

export class PdfJsonFieldManager {
	public fields: Field[];
	public initialLength: number;

	public constructor(input: Optional<PdfJson | PdfJsonFieldManager | Field[]>) {
		if (input) {
			if (input instanceof PdfJsonFieldManager) {
				this.fields = input.fields.slice();

			}else if (Array.isArray(input)) {
				this.fields = input;

			}else {
				this.fields = collectFields(input);
			}
		}else {
			this.fields = [];
		}
		this.initialLength = this.fields.length;
	}

	public get isEmpty(): boolean {
		return this.fields.length === 0;
	}

	public get length(): number {
		return this.fields.length;
	}

	/** Returns the given field by matching the name. */
	public find<T extends Field>(name: string): T | undefined {
		return this.fields.find(field => field.name === name) as T;
	}

	/**
	 * Finds the given field and returns true/false if the checked value is boolean.
	 * Returns null if the checked value is not boolean.
	 * Returns undefined if not found.
	 */
	public getChecked(name: string): Optional<boolean> {
		const field = this.find<CheckField>(name);
		if (field) {
			if (typeof(field.checked) === "boolean") {
				return field.checked;
			}
			return null;
		}
		return undefined;
	}

	/**
	 * Finds the given field and returns the value as a non-blank string.
	 * Returns null if the value is not a string or empty.
	 * Returns undefined if not found.
	 */
	public getValue(name: string): Optional<string> {
		const field = this.find<TextField>(name);
		if (field) {
			if (typeof(field.value) === "string") {
				return field.value;
			}
			return null;
		}
		return undefined;
	}

	public has(name: string): boolean {
		return this.find(name) !== undefined;
	}

	/** Removes the field so that it cannot be reused. */
	public remove(field: Optional<Field | string>): void {
		if (typeof(field) === "string") {
			field = this.find(field);
		}
		if (field) {
			const fieldIndex = this.fields.indexOf(field);
			if (fieldIndex > -1) {
				this.fields.splice(fieldIndex, 1);
			}
		}
	}

	public static from<U extends PdfJson, V extends PdfJsonFieldManager>(input: Optional<U | V>): PdfJsonFieldManager {
		return new PdfJsonFieldManager(input);
	}

}