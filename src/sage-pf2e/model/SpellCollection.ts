import { sortComparable, sortPrimitive, toUniqueDefined, type Sorter } from "@rsc-utils/array-utils";
import { HasCore, type Core } from "@rsc-utils/class-utils";
import { randomItem } from "@rsc-utils/dice-utils";
import type { Optional } from "@rsc-utils/core-utils";
import type { UUID } from "@rsc-utils/core-utils";
import type { TMagicTradition } from "../common";
import type { ArcaneSchool } from "./ArcaneSchool";
import { HeightenedSpell } from "./HeightenedSpell";
import { Spell } from "./Spell";
import type { Source } from "./base/Source";


function uniqueClean<T>(array: Optional<T>[], sorter: Sorter<any> = sortPrimitive): T[] {
	return array.filter(toUniqueDefined).sort(sorter);
}
function flatUniqueClean<T>(array: T[][]): T[] {
	return uniqueClean(array.flat(Infinity)) as T[];
}

export interface SpellCollectionCore extends Core {
	spells: UUID[];
}

export class SpellCollection extends HasCore<SpellCollectionCore> {

	/**************************************************************************************************************************/
	// Constructors

	public constructor();
	public constructor(spells: Spell[]);
	public constructor(spells: HeightenedSpell[]);
	public constructor(spells: SpellCollection);
	public constructor(spells?: SpellCollection | Spell[] | HeightenedSpell[]) {
		super({ spells: [], objectType: "SpellCollection" });
		if (spells instanceof SpellCollection) {
			this.core.spells = spells.core.spells.slice();
		} else if (Array.isArray(spells)) {
			spells.forEach((spell: Spell | HeightenedSpell) => {
				if (spell instanceof Spell) {
					this.core.spells.push(spell.toHeightenedSpell(spell.level).id);
				}
				if (spell instanceof HeightenedSpell) {
					this.core.spells.push(spell.id);
				}
			});
		}
	}

	/**************************************************************************************************************************/
	// Properties

	public get count(): number { return this.core.spells.length; }
	public get heightenedSpells(): HeightenedSpell[] { return this.core.spells.map(spell => HeightenedSpell.find(spell)!); }
	public get names(): string[] { return uniqueClean(this.spells.map(spell => spell.name)); }
	public get levels(): number[] { return uniqueClean(this.spells.map(spell => spell.level)); }
	public get schools(): ArcaneSchool[] { return uniqueClean(this.spells.map(spell => spell.arcaneSchool), sortComparable); }
	public get spells(): Spell[] { return uniqueClean(this.heightenedSpells.map(spell => spell.spell), sortComparable); }
	public get sources(): Source[] { return uniqueClean(this.spells.map(spell => spell.source), sortComparable); }
	public get traditions(): TMagicTradition[] { return flatUniqueClean<TMagicTradition>(this.spells.map(spell => spell.traditions)); }

	/**************************************************************************************************************************/
	// Instance

	public add(spell: Spell): void;
	public add(spell: HeightenedSpell): void;
	public add(spell: Spell | HeightenedSpell): void {
		let spellId = spell.id;
		if (spell instanceof Spell) {
			spellId = spell.toHeightenedSpell().id;
		}
		if (!this.core.spells.includes(spellId)) {
			this.core.spells.push(spell.id);
		}
	}

	public filter(value: number): SpellCollection;
	public filter(value: string): SpellCollection;
	public filter(value: string[]): SpellCollection;
	public filter(value: ArcaneSchool): SpellCollection;
	public filter(value: ArcaneSchool[]): SpellCollection;
	public filter(value: Source): SpellCollection;
	public filter(value: Source[]): SpellCollection;
	public filter(value: TMagicTradition): SpellCollection;
	public filter(value: TMagicTradition[]): SpellCollection;
	public filter(...args: any[]): SpellCollection {
		const values = flatUniqueClean<number | string | ArcaneSchool | Source>(args);
		if (!values.length) {
			return new SpellCollection(this);
		}
		const spells = this.heightenedSpells.filter(hSpell => {
			const spell = hSpell.spell;
			return values.includes(spell.name)
				|| values.includes(spell.level)
				|| values.includes(spell.arcaneSchool!)
				|| values.includes(spell.source)
				|| values.find(value => spell.traditions.includes(<TMagicTradition>value));
		});
		return new SpellCollection(spells);
	}

	public exclude(value: number): SpellCollection;
	public exclude(value: string): SpellCollection;
	public exclude(value: string[]): SpellCollection;
	public exclude(value: ArcaneSchool): SpellCollection;
	public exclude(value: ArcaneSchool[]): SpellCollection;
	public exclude(value: Source): SpellCollection;
	public exclude(value: Source[]): SpellCollection;
	public exclude(...args: any[]): SpellCollection {
		const values = flatUniqueClean<number | string | ArcaneSchool | Source>(args);
		if (!values.length) {
			return new SpellCollection(this);
		}
		const spells = this.heightenedSpells.filter(hSpell => {
			const spell = hSpell.spell;
			return !values.includes(spell.name)
				&& !values.includes(spell.level)
				&& !values.includes(spell.arcaneSchool!)
				&& !values.includes(spell.source)
				&& !values.find(value => spell.traditions.includes(<TMagicTradition>value));
		});
		return new SpellCollection(spells);
	}

	public random(): HeightenedSpell {
		return randomItem(this.heightenedSpells)!;
	}

}
