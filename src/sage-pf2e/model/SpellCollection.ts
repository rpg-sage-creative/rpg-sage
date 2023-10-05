import utils, { UUID } from "../../sage-utils";
import { Core } from "../../sage-utils/utils/ClassUtils";
import type { TMagicTradition } from "../common";
import type ArcaneSchool from "./ArcaneSchool";
import type Source from "./base/Source";
import HeightenedSpell from "./HeightenedSpell";
import Spell from "./Spell";


function uniqueClean<T>(array: (T | undefined)[]): T[] {
	return array.filter(utils.ArrayUtils.Filters.existsAndUnique);
}
function flatUniqueClean<T>(array: T[][]): T[] {
	return uniqueClean(array.flat(Infinity)) as T[];
}

export interface SpellCollectionCore extends Core {
	spells: UUID[];
}

export default class SpellCollection extends utils.ClassUtils.HasCore<SpellCollectionCore> {

	/**************************************************************************************************************************/
	// Constructors

	public constructor();
	public constructor(spells: Spell[]);
	public constructor(spells: HeightenedSpell[]);
	public constructor(spells: SpellCollection);
	public constructor(spells?: SpellCollection | Spell[] | HeightenedSpell[]) {
		super({ spells: [], objectType: "SpellCollection" });
		if (SpellCollection.instanceOf<SpellCollection>(spells)) {
			this.core.spells = spells.core.spells.slice();
		} else if (Array.isArray(spells)) {
			spells.forEach((spell: Spell | HeightenedSpell) => {
				if (Spell.instanceOf<Spell>(spell)) {
					this.core.spells.push(spell.toHeightenedSpell(spell.level).id);
				}
				if (HeightenedSpell.instanceOf(spell)) {
					this.core.spells.push(spell.id);
				}
			});
		}
	}

	/**************************************************************************************************************************/
	// Properties

	public get count(): number { return this.core.spells.length; }
	public get heightenedSpells(): HeightenedSpell[] { return this.core.spells.map(spell => HeightenedSpell.find(spell)!); }
	public get names(): string[] { return uniqueClean(this.spells.map(spell => spell.name)).sort(); }
	public get levels(): number[] { return uniqueClean(this.spells.map(spell => spell.level)).sort(); }
	public get schools(): ArcaneSchool[] { return uniqueClean(this.spells.map(spell => spell.arcaneSchool)).sort(utils.ArrayUtils.Sort.sortComparable); }
	public get spells(): Spell[] { return uniqueClean(this.heightenedSpells.map(spell => spell.spell)).sort(utils.ArrayUtils.Sort.sortComparable); }
	public get sources(): Source[] { return uniqueClean(this.spells.map(spell => spell.source)).sort(utils.ArrayUtils.Sort.sortComparable); }
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
		return utils.RandomUtils.randomItem(this.heightenedSpells)!;
	}

}
