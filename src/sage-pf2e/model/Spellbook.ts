import { HasCore, type Core } from "@rsc-utils/class-utils";
import { rollDie } from "@rsc-utils/dice-utils";
import { randomItem } from "@rsc-utils/dice-utils";
import { randomUuid, type UUID } from "@rsc-utils/core-utils";
import type { TMagicTradition } from "../common";
import { ARCANE, DASH, DIVINE, OCCULT, PRIMAL } from "../common";
import { filter, findByValue } from "../data/Repository";
import type { ArcaneSchool } from "./ArcaneSchool";
import { SpellCollection } from "./SpellCollection";
import { Source } from "./base/Source";

/*
// function valueOfSpell(spellLevel: number): number {
// 	if (spellLevel == 0) { return 5; }
// 	return spellLevel * spellLevel * 10;
// }
*/

//#region helpers

function getTraditionFromCasterClass(casterClass?: string): TMagicTradition | undefined {
	switch (casterClass) {
		case "Bard": return OCCULT;
		case "Cleric": return DIVINE;
		case "Druid": return PRIMAL;
		case "Wizard": return ARCANE;
		default: return undefined;
	}
}
function getTraditionCasterSpecialty(casterSpecialty?: string): TMagicTradition | undefined {
	switch (casterSpecialty) {
		case "Aberrant": return OCCULT;
		case "Angelic": case "Demonic": return DIVINE;
		case "Draconic": case "Imperial": return ARCANE;
		case "Fey": return PRIMAL;
		default: return undefined;
	}
}
function getTradition(casterClass: string, casterSpecialty?: string): TMagicTradition {
	return getTraditionFromCasterClass(casterClass)
		?? getTraditionCasterSpecialty(casterSpecialty)
		?? ARCANE;
}

function calcTotalSpellsKnown(level: number): number {
	// 10 cantrips, 8 first level, 2 every level thereafter
	return 10 + 8 + (level - 1) * 2;
}

function calcMaxSpellLevel(level: number): number {
	return Math.min(Math.ceil(level / 2), 9);
}

//#endregion

export const CasterClasses = ["Bard", "Cleric", "Druid", "Sorcerer", "Wizard"];

export function randomCasterClass(): string {
	return randomItem(CasterClasses)!;
}

export interface SpellbookCore extends Core<"Spellbook"> {
	casterClass: string;
	casterLevel: number;
	casterSpecialty?: UUID;
	spells: SpellCollection;
	sources: string[];
}

export class Spellbook extends HasCore<SpellbookCore> {

	/**************************************************************************************************************************/
	// Constructors

	public constructor();
	public constructor(spells: SpellCollection);
	public constructor(spells?: any) {
		super(<any>{ spells: new SpellCollection(spells) });
		this.id = `Spellbook${DASH}${randomUuid()}`;
	}

	/**************************************************************************************************************************/
	// Properties

	public get arcaneSchool(): ArcaneSchool | undefined { return this.casterClass === "Wizard" && this.core.casterSpecialty ? findByValue("ArcaneSchool", this.core.casterSpecialty) : undefined; }
	public set arcaneSchool(arcaneSchool: ArcaneSchool | undefined) { this.core.casterSpecialty = arcaneSchool?.id; }

	public get bloodline(): UUID | undefined { return this.casterClass === "Sorcerer" ? this.core.casterSpecialty : undefined; }
	public set bloodline(bloodline: UUID | undefined) { this.core.casterSpecialty = bloodline; }

	public get casterClass(): string { return this.core.casterClass; }
	public set casterClass(casterClass: string) { this.core.casterClass = casterClass; }

	public get casterLevel(): number { return this.core.casterLevel; }
	public set casterLevel(casterLevel: number) { this.core.casterLevel = casterLevel; }

	// public get costToCreate(): number { let value = 0; this.spells.levels.forEach(level => value += this.spells.filter(level).count * valueOfSpell(level)); return value; }

	public get highestSpellLevel(): number { return this.spells.levels[this.spells.levels.length - 1]; }

	public id: string;

	// public get maxSpellLevel(): number { let levels = this.spells.levels; return levels[levels.length - 1]; }

	public get sources(): Source[] { return this.core.sources.map(source => findByValue("Source", source)); }
	public set sources(sources: Source[]) { this.core.sources = sources.map(source => source.code); }

	public get spells(): SpellCollection { return this.core.spells; }
	public set spells(spells: SpellCollection) { this.core.spells = spells; }

	public get totalSpells(): number { return this.spells.count; }

	// public get value(): number { return this.costToCreate / 2; }

	/**************************************************************************************************************************/
	// Instance

	public pages(): number;
	public pages(spellLevel: number): number;
	public pages(spellLevel?: number): number {
		if (typeof(spellLevel) === "number") {
			return this.spells.filter(spellLevel).count;
		}
		let pages = 0;
		this.spells.levels.forEach(level => {
			pages += this.spells.filter(level).count * (level || 1);
		});
		return pages;
	}

	/**************************************************************************************************************************/
	// Static

	public static random(): Spellbook;
	public static random(casterClass: string): Spellbook;
	public static random(casterClass: string, casterLevel: number): Spellbook;
	public static random(casterClass: string, casterLevel: number, casterSpecialty?: string): Spellbook;
	public static random(casterClass: string, casterLevel: number, casterSpecialty?: string, sources?: string[]): Spellbook;
	public static random(casterClass = "Wizard", casterLevel = 1, casterSpecialty?: string, sources: string[] = []): Spellbook {
		const tradition = getTradition(casterClass, casterSpecialty),
			traditionSpells = filter("Spell", spell => spell.traditions.includes(tradition)),
			traditionCollection = new SpellCollection(traditionSpells);

		const sourceFilter = sources.map(source => findByValue("Source", source)),
			arcaneSchool = findByValue("ArcaneSchool", casterSpecialty),
			isWizardSpecialist = casterClass === "Wizard" && arcaneSchool !== undefined,
			// CRB = !sourceFilter.length || sourceFilter.find(source => source.isCore) ? Source.Core : null,
			spells: SpellCollection = new SpellCollection();

		const argsData: TRandomSpellbookMeta = {
			arcaneSchool,
			casterSpecialty,
			isWizardSpecialist,
			maxSpellLevelAtThisLevel: 0,
			sourceFilter,
			spells,
			totalSpellsAtThisLevel: 10,
			traditionCollection
		};

		// Add Cantrips
		addCantrips(argsData);

		// Handle each level up
		for (let i = 1; i <= casterLevel; i++) {
			//calculate total number of spells known at this wizard level
			argsData.totalSpellsAtThisLevel = calcTotalSpellsKnown(i);

			//calculate max spell level at this wizard level
			argsData.maxSpellLevelAtThisLevel = calcMaxSpellLevel(i);

			//add a spell from their max spell level available
			addMaxLevelSpells(argsData);

			//fill the remaining with spells of random levels available
			addSpells(argsData);
		}

		const spellbook = new Spellbook();
		spellbook.core.casterClass = casterClass;
		spellbook.core.casterLevel = casterLevel;
		spellbook.core.casterSpecialty = casterSpecialty;
		spellbook.core.sources = sources;
		spellbook.spells = spells;
		return spellbook;
	}

}

type TRandomSpellbookMeta = {
	arcaneSchool?: ArcaneSchool;
	casterSpecialty?: string;
	isWizardSpecialist: boolean;
	maxSpellLevelAtThisLevel: number;
	sourceFilter: Source[];
	spells: SpellCollection;
	totalSpellsAtThisLevel: number;
	traditionCollection: SpellCollection;
};

function addCantrips({ arcaneSchool, spells, traditionCollection, totalSpellsAtThisLevel }: TRandomSpellbookMeta): void {
	for (let i = totalSpellsAtThisLevel; i--;) {
		let pool = traditionCollection.filter(0).filter(Source.Core).exclude(spells.names);
		if (arcaneSchool && i < 5 && pool.filter(arcaneSchool).count) {
			pool = pool.filter(arcaneSchool);
		}
		spells.add(pool.random());
	}
}

function addMaxLevelSpells({ arcaneSchool, maxSpellLevelAtThisLevel, sourceFilter, spells, traditionCollection }: TRandomSpellbookMeta): void {
	while (spells.filter(maxSpellLevelAtThisLevel).count < 2) {
		let pool = traditionCollection
			.filter(maxSpellLevelAtThisLevel)
			.filter(sourceFilter)
			.filter(Source.Core)
			.exclude(spells.names);
		if (arcaneSchool && pool.filter(arcaneSchool).count) {
			pool = pool.filter(arcaneSchool);
		}
		if (!pool.count) {
			continue;
		}
		spells.add(pool.random());
	}
}

function addSpells({ casterSpecialty, isWizardSpecialist, maxSpellLevelAtThisLevel, sourceFilter, spells, traditionCollection, totalSpellsAtThisLevel }: TRandomSpellbookMeta): void {
	while (spells.count < totalSpellsAtThisLevel) {
		//pick a random level and remove opposed schools and current spells
		let pool = traditionCollection
			.filter(rollDie(maxSpellLevelAtThisLevel))
			.filter(sourceFilter)
			.exclude(spells.names);

		//75% chance of core spell
		if (rollDie(100) > 25 && pool.filter(Source.Core).count) {
			pool = pool.filter(Source.Core);
		}

		//50% chance of specialty school
		if (isWizardSpecialist && rollDie(100) > 50 && pool.filter(casterSpecialty!).count) {
			pool = pool.filter(casterSpecialty!);
		}

		if (!pool.count) {
			break;
		}
		spells.add(pool.random());
	}
}
