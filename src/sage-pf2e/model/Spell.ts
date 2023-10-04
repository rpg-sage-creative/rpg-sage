import utils, { UUID } from "../../sage-utils";
import { Core } from "../../sage-utils/utils/ClassUtils";
import type { TMagicComponent, TMagicTradition } from '../common';
import { ABILITIES, NEWLINE, toModifier } from '../common';
import RenderableContent from '../data/RenderableContent';
import { find, findByValue } from '../data/Repository';
import type ArcaneSchool from './ArcaneSchool';
import type { SourcedCore } from "./base/HasSource";
import HasSource from './base/HasSource';
import type Domain from './Domain';
import HeightenedSpell from "./HeightenedSpell";

//#region types

export type TSpellAfflictionType = "disease" | "poison";
export type TSpellAfflictionStage = { description: string; duration: string; stage: number; };
export type TSpellAffliction = { description: string; level: number; maximumDuration: string; name: string; stages: TSpellAfflictionStage[]; type: TSpellAfflictionType; };
export type TSpellComponent = "focus" | "material" | "somatic" | "verbal";
export type TSpellHeighten = { bump?: number; change: string; level?: number; };
export type TSpellReaction = { effect: string; name: string; trigger: string; };
export type TSpellCreature = {
	name: string;
	level: number;
	traits: string[];
	perception: { value: number; senses: string[]; };
	languages: string[];
	languagesSpecial: string;
	skills: { name: string; value: number; }[];
	abilityModifiers: number[];
	interactive: { name: string; details: string[]; }[];
	acSaves: { ac: number; fort: number; ref: number; will: number; };
	hp: { hp: number; };
	immunities: string[];
	resistances: string[];
	speeds: { type: string; value: number; }[];
	offensive: { name: string; details: string[]; }[];
};

//#endregion

//#region interfaces

export interface SpellCoreBase<T extends string = string> extends SourcedCore<T> {
	affliction?: TSpellAffliction;
	archetype?: string;
	area?: string;
	cast: string;
	components?: TSpellComponent[];
	cost?: string;
	creature?: TSpellCreature;
	domain?: string;
	duration?: string;
	focus: boolean;
	heightened?: TSpellHeighten[];
	heightenedAs?: string[];
	level: number;
	mystery?: string;
	range?: string;
	reaction?: TSpellReaction;
	requirements?: string;
	savingThrow?: string;
	targets?: string;
	traditions: TMagicTradition[];
	trigger?: string;
}

export type SpellCore = SpellCoreBase<"Spell">;
/*// export interface SpellCore extends SpellCoreBase<"Spell"> { }*/

export interface HeightenedSpellCore extends Core<"HeightenedSpell"> {
	bumps: number;
	change?: string;
	level: number;
	spell: UUID;
}

//#endregion

//#region helpers

function afflictionToHtml(affliction: TSpellAffliction): string {
	const stages = affliction.stages.map((stage, _) => {
		const duration = stage.duration ? ` (${stage.duration})` : ``;
		return `<b>Stage ${stage.stage}</b> ${stage.description}${duration}`;
	}).join("; ");
	const maxDuration = affliction.maximumDuration ? `; <b>Maxiumum Duration</b> ${affliction.maximumDuration}` : "";
	return `<blockquote><b>${affliction.name}</b> (${affliction.type}); <b>Level</b> ${affliction.level}${maxDuration}. ${affliction.description} ${stages}</blockquote>`;
}
function reactionToHtml(reaction: TSpellReaction): string {
	return `<blockquote><b>${reaction.name} [R] Trigger</b> ${reaction.trigger} <b>Effect</b> ${reaction.effect}</blockquote>`;
}
function creatureToHtml(creature: TSpellCreature): string {
	const languagesSpecial = creature.languagesSpecial ? ` (${creature.languagesSpecial})` : ``;
	const mappedSkills = creature.skills.map(skill => `${skill.name} ${toModifier(skill.value)}`).join(", ");
	const mappedSpeeds = creature.speeds.map(speed => `${speed.type} ${speed.value} feet`).join(", ");
	return `<blockquote>`
		+ `<b><u>${creature.name} - Creature ${creature.level}</u></b>`
		+ `<br/>` + creature.traits.map(t => utils.StringUtils.capitalize(t)).join(", ")
		+ `<br/><b>Perception</b> ${toModifier(creature.perception.value)}; ${creature.perception.senses.join(", ")}`
		+ `<br/><b>Languages</b> ${(creature.languages || []).length ? creature.languages.join(", ") : "-"}${languagesSpecial}`
		+ `<br/><b>Skills</b> ${mappedSkills}`
		+ `<br/>` + creature.abilityModifiers.map((abil, abilIndex) => `<b>${ABILITIES[abilIndex].slice(0, 3)}</b> ${toModifier(abil)}`).join(", ")
		+ creature.interactive.map(info => `<br/><b>${info.name}</b> ${info.details.join("<br/>\t")}`)
		+ `<br/>`
		+ `<br/><b>AC</b> ${creature.acSaves.ac}; <b>Fort</b> ${toModifier(creature.acSaves.fort)}, <b>Ref</b> ${toModifier(creature.acSaves.ref)}, <b>Will</b> ${toModifier(creature.acSaves.will)}`
		+ `<br/><b>HP</b> ${creature.hp.hp}; <b>Immunities</b> ${creature.immunities.join(", ")}; <b>Resistances</b> ${creature.resistances.join(", ")}`
		+ `<br/>`
		+ `<br/><b>Speed</b> ${mappedSpeeds}`
		+ creature.offensive.map(info => `<br/><b>${info.name}</b> ${info.details.join("<br/>\t")}`)
		+ `</blockquote>`
		;
}

function heightenSpell(spellId: UUID, core: SpellCore): HeightenedSpell[] {
	const heightened = core.heightened ?? [];
	const bump = heightened.find(h => (h.bump ?? 0) > 0);
	let last = new HeightenedSpell({ spell: spellId, level: core.level, change: undefined, bumps: 0, objectType: "HeightenedSpell" });
	const spells = [last];
	for (let level = core.level + 1; level < 11; level++) {
		while (!spells.find(hSpell => hSpell.level === level - 1)) {
			last = last.toNextLevel();
			spells.push(last);
		}
		if (bump) {
			if ((level - core.level) % bump.bump! === 0) {
				last = last.toNextLevel(bump.change, true);
				spells.push(last);
			}
		} else {
			const levelChange = heightened.find(h => h.level === level);
			if (levelChange) {
				last = last.toNextLevel(levelChange.change);
				spells.push(last);
			}
		}
	}
	while (spells.length < 11 - core.level) {
		last = last.toNextLevel();
		spells.push(last);
	}
	if (spells.length !== 11 - core.level) {
		console.debug(spellId, core, spells);
	}
	return spells;
}

//#endregion

export default class Spell<T extends string = "Spell", U extends SpellCoreBase<T> = SpellCoreBase<T>> extends HasSource<U, T> {
	public constructor(core: U) {
		super(core);
		/*
		// if (core.focus) {
		// 	let className = this.traits.find(trait => ClassNames.includes(trait));
		// 	let archetypeName = ArchetypeNames.find(archetype => archetype === this.core.archetype);
		// 	this.id = createId(core.objectType, archetypeName || className, core.name, core.source);
		// }
		// this.heightened = heightenSpell(this.id, core);
		*/
	}

	//#region properties

	public get affliction(): TSpellAffliction | undefined { return this.core.affliction; }
	private _arcaneSchool?: ArcaneSchool | null;
	public get arcaneSchool(): ArcaneSchool | undefined {
		if (this._arcaneSchool === undefined) {
			for (const trait of this.traits) {
				const arcaneSchool = findByValue("ArcaneSchool", trait);
				if (arcaneSchool) {
					this._arcaneSchool = arcaneSchool;
					break;
				}
			}
		}
		return this._arcaneSchool ?? undefined;
	}
	public get archetypeName(): string | undefined { return this.core.archetype; }
	public get area(): string | undefined { return this.core.area; }
	public canHeighten = (this.core.heightenedAs ?? this.core.heightened ?? []).length > 0;
	public get cast(): string { return this.core.cast; }
	public components = <TMagicComponent[]>(this.core.components ?? []).map(component => utils.StringUtils.capitalize(component));
	public get cost(): string | undefined { return this.core.cost; }
	private _domain?: Domain | null;
	public get domain(): Domain | undefined {
		if (this._domain === undefined) {
			this._domain = (this.core.domain ? findByValue("Domain", this.core.domain) : null)
				?? find("Domain", (domain: Domain) => domain.toJSON().spells.includes(this.name))
				?? null;
		}
		return this._domain ?? undefined;
	}
	public get domainName(): string | undefined { return this.core.domain; }
	public get duration(): string | undefined { return this.core.duration; }
	// public heightened: HeightenedSpell[];
	public get isCantrip(): boolean { return this.traits.includes("Cantrip"); }
	public isFocus = false;
	public get level(): number { return this.core.level ?? 0; }
	public get mystery(): string | undefined { return this.core.mystery; }
	public get range(): string | undefined { return this.core.range; }
	public get reaction(): TSpellReaction | undefined { return this.core.reaction; }
	public get requirements(): string | undefined { return this.core.requirements; }
	public get savingThrow(): string | undefined { return this.core.savingThrow; }
	public get targets(): string | undefined { return this.core.targets; }
	public traditions = <TMagicTradition[]>(this.core.traditions || []).map(tradition => utils.StringUtils.capitalize(tradition));
	public get trigger(): string | undefined { return this.core.trigger; }

	//#endregion

	//#region instance methods

	public toHeightenedSpell(): HeightenedSpell;
	public toHeightenedSpell(level: number): HeightenedSpell;
	public toHeightenedSpell(level = this.level): HeightenedSpell {
		return heightenSpell(this.id, this.core as SpellCore).find(h => h.level === level)!;
		/*// return this.heightened.find(h => h.level === level);*/
	}

	//#endregion

	//#region utils.RenderUtils.IRenderable
	private toRenderableContentTitle(content: utils.RenderUtils.RenderableContent): void {
		const cantrip = this.isCantrip ? " Cantrip" : "";
		const focus = !this.isCantrip && this.isFocus ? " Focus" : "";
		const spell = !this.isCantrip && !this.isFocus ? " Spell" : "";
		const title = `<b>${this.name}</b> - ${cantrip}${focus}${spell} ${this.level}`;
		content.setTitle(title);
	}
	private toRenderableContentTraditionsDomainMystery(): string[] {
		const description: string[] = [];
		if (this.traditions.length) {
			description.push(`<b>Traditions</b> ${this.traditions.map(t => t.toLowerCase()).join(", ")}`);
		}
		if (this.domain) {
			description.push(`<b>Domain</b> ${this.domain.nameLower}`);
		}
		if (this.mystery) {
			description.push(`<b>Mystery</b> ${this.mystery}`);
		}
		return description;
	}
	private toRenderableContentCastTriggerCostRequirements(): string {
		const castTriggerCostRequirements: string[] = [];
		if (this.components.length) {
			const parentheses = !(this.cast.startsWith("[") && this.cast.endsWith("]"));
			castTriggerCostRequirements.push(`<b>Cast</b> ${this.cast} ${parentheses && "(" || ""}${this.components.map(c => c.toLowerCase()).join(", ")}${parentheses && ")" || ""}`);
		} else {
			castTriggerCostRequirements.push(`<b>Cast</b> ${this.cast}`);
		}
		if (this.trigger) {
			castTriggerCostRequirements.push(`<b>Trigger</b> ${this.trigger}`);
		}
		if (this.cost) {
			castTriggerCostRequirements.push(`<b>Cost</b> ${this.cost}`);
		}
		if (this.requirements) {
			castTriggerCostRequirements.push(`<b>Requirements</b> ${this.requirements}`);
		}
		return castTriggerCostRequirements.join("; ");
	}
	private toRenderableContentRangeAreaTargets(): string {
		const rangeAreaTargets: string[] = [];
		if (this.range) {
			rangeAreaTargets.push(`<b>Range</b> ${this.range}`);
		}
		if (this.area) {
			rangeAreaTargets.push(`<b>Area</b> ${this.area}`);
		}
		if (this.targets) {
			rangeAreaTargets.push(`<b>Targets</b> ${this.targets}`);
		}
		return rangeAreaTargets.join("; ");
	}
	private toRenderableContentSavingThrowDuration(): string {
		const savingThrowDuration: string[] = [];
		if (this.savingThrow) {
			savingThrowDuration.push(`<b>Saving Throw</b> ${this.savingThrow}`);
		}
		if (this.duration) {
			savingThrowDuration.push(`<b>Duration</b> ${this.duration}`);
		}
		return savingThrowDuration.join("; ");
	}
	private toRenderableContentHeighten(content: utils.RenderUtils.RenderableContent): void {
		if (this.canHeighten) {
			content.append("");
			const heightenedList = (this.core.heightened ?? []).map(h => `<b>Heightened (${h.bump ? "+" + h.bump : utils.NumberUtils.nth(h.level!)})</b> ${h.change}`);
			if (this.core.heightenedAs) {
				content.append(`<b>Heightened</b> As <i>${this.core.heightenedAs}</i>`);
				if (heightenedList.length) {
					content.append(`<blockquote>${heightenedList.join(NEWLINE)}</blockquote>`);
				}
			} else {
				content.append(...heightenedList);
			}
		}
	}
	public toRenderableContent(): utils.RenderUtils.RenderableContent {
		const content = new RenderableContent(this);

		this.toRenderableContentTitle(content);

		// In case I want to include the spell list description here.
		// this.appendDescriptionTo(content);
		// content.append("");

		const description = [`${this.traits.join(", ")}`];

		description.push(...this.toRenderableContentTraditionsDomainMystery());

		const castTriggerCostRequirements = this.toRenderableContentCastTriggerCostRequirements();
		if (castTriggerCostRequirements.length) {
			description.push(castTriggerCostRequirements);
		}

		const rangeAreaTargets = this.toRenderableContentRangeAreaTargets();
		if (rangeAreaTargets.length) {
			description.push(rangeAreaTargets);
		}

		const savingThrowDuration = this.toRenderableContentSavingThrowDuration();
		if (savingThrowDuration.length) {
			description.push(savingThrowDuration);
		}

		content.append(...description);
		this.appendDetailsTo(content);

		if (this.affliction) {
			content.append("");
			content.append(afflictionToHtml(this.affliction));
		}
		if (this.reaction) {
			content.append("");
			content.append(reactionToHtml(this.reaction));
		}

		this.toRenderableContentHeighten(content);

		if (this.core.creature) {
			content.append(creatureToHtml(this.core.creature));
		}

		const italicMatches = content.findMatches(/<i>(.*?)<\/i>/gi);
		const italicPhrases = italicMatches.map(match => match.slice(3, -4));
		const spellSearches = italicPhrases.map(Spell.find);
		const validSpells = <Spell[]>spellSearches.filter(sp => sp && sp !== this);
		const uniqueSpells = [this, ...validSpells].filter(utils.ArrayUtils.Filters.unique);
		const otherSpells = uniqueSpells.slice(1);
		content.addAonLink(...otherSpells.map(spell => spell.toAonLink()));

		return content;
	}
	//#endregion utils.RenderUtils.IRenderable

	//#region utils.SearchUtils.ISearchable

	public get searchResultCategory(): string {
		const level = this.isCantrip ? `Cantrip` : `Spell ${this.level}`;
		const rarity = this.isNotCommon ? `[${this.rarity}]` : ``;
		return `${level} ${rarity}`;
	}

	public search(searchInfo: utils.SearchUtils.SearchInfo): utils.SearchUtils.SearchScore<this> {
		const score = super.search(searchInfo);
		if (searchInfo.globalFlag) {
			score.append(searchInfo.score(this, this.traits, this.traditions, this.archetypeName));
		}

		const keyTerm = utils.StringUtils.capitalize(searchInfo.keyTerm || "");
		if (findByValue("Class", keyTerm) && !this.traits.includes(keyTerm)) {
			score.fail();
		}
		return score;
	}

	public toSearchResult(): string {
		return this.name.italics();
	}

	//#endregion utils.SearchUtils.ISearchable

	//#region static

	public static find(value: UUID): Spell | undefined {
		return findByValue("Spell", value);
	}

	//#endregion
}
