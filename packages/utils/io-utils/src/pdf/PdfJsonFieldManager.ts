import { isDefined, type Optional } from "@rsc-utils/core-utils";
import { collectFields } from "./internal/collectFields.js";
import type { CheckField, Field, TextField } from "./internal/types.js";
import type { PdfJson } from "./types.js";

type TransmutedField = Field & { id?:string | number; };
type Transmuter = (fields: Field) => TransmutedField;

export class PdfJsonFieldManager {
	public fields: TransmutedField[];
	public initialLength: number;

	public constructor(input: Optional<PdfJson | PdfJsonFieldManager | Field[]>, transmuter?: Transmuter) {
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
		if (transmuter) {
			this.fields = this.fields.map(({ name, value, checked }: any) => transmuter({ name, value, checked }));
		}
		this.initialLength = this.fields.length;
	}

	public get isEmpty(): boolean {
		return this.fields.length === 0;
	}

	public get length(): number {
		return this.fields.length;
	}

	/** Returns the given field by matching the name or transmuted id. */
	public find<T extends Field>(value: Optional<string | number>): T | undefined {
		if (isDefined(value)) {
			return this.fields.find(field => field.name === value || field.id === value) as T;
		}
		return undefined;
	}

	/**
	 * Returns a string array if the field exists as a valid string.
	 * Returns null if the field is not a string.
	 * Returns undefined if not found.
	 */
	public getArray(key: Optional<string | number>, delim = ","): Optional<string[]> {
		const value = this.getValue(key);
		return isDefined(value)
			? value.replace(/\n/g, delim).split(delim)
			: value;
	}

	/**
	 * Finds the given field and returns true/false if the checked value is boolean.
	 * Returns null if the checked value is not boolean.
	 * Returns undefined if not found.
	 */
	public getChecked(key: Optional<string | number>): Optional<boolean> {
		const field = this.find<CheckField>(key);
		if (field) {
			if (typeof(field.checked) === "boolean") {
				return field.checked;
			}
			return null;
		}
		return undefined;
	}

	/**
	 * Returns a number if the field exists as string parseable as a number.
	 * Returns NaN if the field exists as a non-numeric string.
	 * Returns null if the field is not a string.
	 * Returns undefined if not found.
	 */
	public getNumber(key: Optional<string | number>): Optional<number>;
	public getNumber(key: Optional<string | number>, defValue: number): number;
	public getNumber(key: Optional<string | number>, defValue?: number): Optional<number> {
		const sValue = this.getValue(key);
		if (isDefined(sValue)) return +sValue;
		return defValue ?? sValue;
	}

	/**
	 * Finds the given field and returns the value as a non-blank string.
	 * Returns null if the value is not a string or empty.
	 * Returns undefined if not found.
	 */
	public getValue(key?: Optional<string | number>): Optional<string>;
	public getValue(key: Optional<string | number>, defValue: string): string;
	public getValue(key: Optional<string | number>, defValue?: string): Optional<string> {
		const field = this.find<TextField>(key);
		if (field) {
			if (typeof(field.value) === "string") {
				return field.value.trim() === "" ? null : field.value;
			}
			return defValue ?? null;
		}
		return defValue ?? undefined;
	}

	/** Returns true if the key was found, regards of whether or not it had a valid value. */
	public has(key: Optional<string | number>): boolean {
		return this.find(key) !== undefined;
	}

	/** Removes the field so that it cannot be reused. */
	public remove(field: Optional<Field | string | number>): void {
		const isNotField = (value: any): value is number | string => ["number","string"].includes(typeof(value));
		if (isNotField(field)) {
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