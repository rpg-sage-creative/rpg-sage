import type { Optional } from "@rsc-utils/core-utils";
import { Ability } from "./Ability.js";

export const SavingThrowNames = ["Fortitude", "Reflex", "Will"] as const;

export type SavingThrowName = typeof SavingThrowNames[number];
export type SavingThrowKey = Lowercase<SavingThrowName>;

export type SavingThrowAbbr = "Fort" | "Ref" | "Will";
export type SavingThrowAbbrKey = Lowercase<SavingThrowAbbr>;

export type SavingThrowNameResolvable = SavingThrowName | SavingThrowAbbr | SavingThrowKey | SavingThrowKey;

const ParseSaveRegExp = /will|ref(lex)?|fort(itude)?/i;

export class SavingThrow {
	public constructor(public name: SavingThrowName) {
		this.abbr = this.name.slice(0, name === "Reflex" ? 3 : 4) as SavingThrowAbbr;
		this.abbrKey = this.abbr.toLowerCase();
		this.key = this.name.toLowerCase();

		this.ability = Ability.findByName(this.abbr === "Fort" ? "Con" : this.abbr === "Ref" ? "Dex" : "Wis");
	}

	/** 3 letter abbreviation of this.name */
	public readonly abbr: SavingThrowAbbr;

	/** Lowercased 3 letter abbreviation of this.name; used as the key in objects/maps */
	public readonly abbrKey: SavingThrowAbbrKey;

	public readonly ability: Ability;

	/** this.name.toLowerCase(); used as the key in objects/maps */
	public readonly key: SavingThrowKey;

	public toString() { return this.name; }

	private static _all: SavingThrow[];
	public static all(): SavingThrow[] {
		return this._all ?? (this._all = this.names().map(name => new SavingThrow(name)));
	}

	public static findByName(savingThrow: SavingThrowNameResolvable): SavingThrow;
	public static findByName(name: Optional<string>): SavingThrow | undefined;
	public static findByName(name: Optional<string>): SavingThrow | undefined {
		if (!name) return undefined;
		const lower = name.toLowerCase();
		return SavingThrow.all().find(savingThrow => savingThrow.abbrKey === lower || savingThrow.key === lower);
	}

	public static isValid(ability: Optional<string>): ability is SavingThrowNameResolvable {
		return SavingThrow.findByName(ability) !== undefined;
	}

	/** Converts a Saving Throw modifier to a Saving Throw DC. */
	public static modToDc(mod: Optional<number>): number {
		return (mod ?? 0) + 10;
	}

	public static names(): readonly SavingThrowName[] {
		return SavingThrowNames;
	}

	public static parse(value: Optional<string>): SavingThrow | undefined {
		if (!value) return undefined;
		const match = ParseSaveRegExp.exec(value);
		if (!match) return undefined;
		return SavingThrow.findByName(match[0]);
	}
}