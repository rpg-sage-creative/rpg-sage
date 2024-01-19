import type { TAbility, TBonusType, TProficiency, TSpeedType, TMagicTradition, TCasterType, TSize } from "../common";

/**************************************************************************************************************************/
// Interfaces and Class

export type TMetadataAbilitiesType = "Boost" | "Flaw" | "Key";

export interface IMetadataAbilities {
	class?: string;
	given?: TAbility[];
	options?: (TAbility | "Free")[];
	selected?: TAbility;
	type: TMetadataAbilitiesType;
}

export interface IMetadataBulk {
	limit?: number;
	threshold?: number;
	bonusType?: TBonusType;
}

export interface IMetadataAbilityModifierCap {
	ability: TAbility;
	maxValue: number;
}

export interface IMetadataArmorClass {
	ac: number;
	// tac: number;
	bonusType: TBonusType;
}

export interface IMetadataFeat {
	filterClassPath?: boolean;
	filterLevel?: number;
	filterTrait?: string;
	given?: string;
	options?: string[];
	selected?: string;
}

export interface IMetadataHitPoints {
	bonusType?: TBonusType;
	perLevelMin: number;
	max?: number;
	maxPerLevel?: number;
	temp?: number;
	tempPerLevel?: number;
}

export interface IMetadataLanguages {
	bonus?: string[];
	given?: string[];
	options?: string[];
	selected?: string;
}

export interface IMetadataProficiency {
	category: string;
	given?: string;
	proficiency: TProficiency;
	options?: string[];
	selected?: string;
}

export interface IMetadataSpeed {
	type: TSpeedType;
	value: number;
}

export interface IMetadataSpell {
	level: number;
	perDay?: number;
	spell: string;
	tradition: TMagicTradition;
	type: TCasterType;
}

export interface IMetadata {
	abilities: IMetadataAbilities[];
	abilityModifierCaps: IMetadataAbilityModifierCap[];
	actions: string[];
	armorClasses: IMetadataArmorClass[];
	bulk: IMetadataBulk[];
	classPath: string;
	dedicationClass: string;
	feat: IMetadataFeat;
	hitPoints: IMetadataHitPoints[];
	languages: IMetadataLanguages[];
	potencyRuneValue: number;
	potentAbilities: TAbility[];
	proficiencies: IMetadataProficiency[];
	senses: string[];
	size: TSize;
	speeds: IMetadataSpeed[];
	spells: IMetadataSpell[];
	traits: string[];
}

export interface IHasMetadata {
	hasMetadata: boolean;
	metadata: Metadata;
	name: string;
	objectType: string;
}

export class Metadata {
	/**************************************************************************************************************************/
	// Constructor

	public constructor(public core: Partial<IMetadata> = {}) { }

	/**************************************************************************************************************************/
	// Abilities

	private getAbilitiesFreeCount(type: TMetadataAbilitiesType): number {
		let free = 0;
		(this.core.abilities || []).filter(abilitiesMeta => abilitiesMeta.type === type).forEach(abilitiesMeta => {
			if ((abilitiesMeta.options || []).includes("Free")) {
				free++;
			}
		});
		return free;
	}
	private getAbilitiesGiven(type: TMetadataAbilitiesType): TAbility[] {
		const given: TAbility[] = [];
		(this.core.abilities || []).filter(abilitiesMeta => abilitiesMeta.type === type).forEach(abilitiesMeta => {
			given.push(...(abilitiesMeta.given || []));
		});
		return given;
	}
	private getAbilitiesOptions(type: TMetadataAbilitiesType): TAbility[] {
		const options: TAbility[] = [];
		(this.core.abilities || []).filter(abilitiesMeta => abilitiesMeta.type === type).forEach(abilitiesMeta => {
			options.push(...<TAbility[]>(abilitiesMeta.options || []));
		});
		return options;
	}
	private getAbilitiesSelected(type: TMetadataAbilitiesType): TAbility[] {
		const selected: TAbility[] = [];
		(this.core.abilities || []).filter(abilitiesMeta => abilitiesMeta.type === type).forEach(abilitiesMeta => {
			if (abilitiesMeta.selected) {
				selected.push(abilitiesMeta.selected);
			}
		});
		return selected;
	}
	private selectAbilities(type: TMetadataAbilitiesType, abilities: TAbility[]): void {
		const abilitiesMetas = (this.core.abilities || []).filter(abilitiesMeta => abilitiesMeta.type === type);
		abilities.forEach(ability => {
			let abilitiesMeta = abilitiesMetas.find(_abilitiesMeta =>
				!_abilitiesMeta.given && !_abilitiesMeta.selected && (_abilitiesMeta.options || []).includes(ability)
			);
			if (!abilitiesMeta) {
				abilitiesMeta = abilitiesMetas.find(_abilitiesMeta =>
					!_abilitiesMeta.given && !_abilitiesMeta.selected && (_abilitiesMeta.options || []).includes("Free")
				);
			}
			if (abilitiesMeta) {
				abilitiesMeta.selected = ability;
			}
		});
	}

	public get abilityBoostsFreeCount(): number { return this.getAbilitiesFreeCount("Boost"); }
	public get abilityBoostsGiven(): TAbility[] { return this.getAbilitiesGiven("Boost"); }
	public get abilityBoostsOptions(): TAbility[] { return this.getAbilitiesOptions("Boost"); }
	public get abilityBoostsSelected(): TAbility[] { return this.getAbilitiesSelected("Boost"); }
	public get abilityBoosts(): TAbility[] { return this.abilityBoostsGiven.concat(this.abilityBoostsSelected); }

	public get abilityFlawsFreeCount(): number { return this.getAbilitiesFreeCount("Flaw"); }
	public get abilityFlawsGiven(): TAbility[] { return this.getAbilitiesGiven("Flaw"); }
	public get abilityFlawsOptions(): TAbility[] { return this.getAbilitiesOptions("Flaw"); }
	public get abilityFlawsSelected(): TAbility[] { return this.getAbilitiesSelected("Flaw"); }
	public get abilityFlaws(): TAbility[] { return this.abilityFlawsGiven.concat(this.abilityFlawsSelected); }

	public get abilityKeyFreeCount(): number { return this.getAbilitiesFreeCount("Key"); }
	public get abilityKeyGiven(): TAbility[] { return this.getAbilitiesGiven("Key"); }
	public get abilityKeyOptions(): TAbility[] { return this.getAbilitiesOptions("Key"); }
	public get abilityKeySelected(): TAbility[] { return this.getAbilitiesSelected("Key"); }
	public get abilityKeys(): TAbility[] { return this.abilityKeyGiven.concat(this.abilityKeySelected); }

	public get needsAbilitySelection(): boolean {
		return (this.core.abilities || []).find(abilitiesMeta => (abilitiesMeta.options || []).length > 0 && !abilitiesMeta.selected) !== undefined;
	}

	public getAbilityDelta(ability: TAbility): number {
		let delta = 0;
		(this.core.abilities || []).forEach(abilitiesMeta => {
			const given = (abilitiesMeta.given || []).includes(ability) ? 1 : 0,
				selected = abilitiesMeta.selected === ability ? 1 : 0,
				multiplier = abilitiesMeta.type === "Flaw" ? -1 : 1;
			delta += (given || selected) * multiplier;
		});
		return delta;
	}
	public getKeyAbility(className: string): TAbility | undefined {
		const abilitiesMeta = (this.core.abilities || []).find(_abilitiesMeta => _abilitiesMeta.type === "Key" && _abilitiesMeta.class === className);
		return abilitiesMeta && (abilitiesMeta.given?.[0] || abilitiesMeta.selected);
	}

	public selectAbilityBoosts(abilities: TAbility[]): void {
		this.selectAbilities("Boost", abilities);
	}
	public selectAbilityFlaws(abilities: TAbility[]): void {
		this.selectAbilities("Flaw", abilities);
	}
	public selectKeyAbility(ability: TAbility): void {
		this.selectAbilities("Key", [ability]);
	}

	/**************************************************************************************************************************/
	// Action

	public get actions(): string[] {
		return (this.core.actions || []);
	}

	/**************************************************************************************************************************/
	// Bulk

	/** Returns only values with a value for .limit */
	public get bulkLimits(): IMetadataBulk[] {
		return (this.core.bulk ?? []).filter(bulkMeta => bulkMeta.limit);
	}
	public get bulkLimitDelta(): number {
		let delta = 0;
		(this.core.bulk || []).forEach(bulkMeta => delta += bulkMeta.limit || 0);
		return delta;
	}
	/** Returns only values with a value for .threshold */
	public get bulkThresholds(): IMetadataBulk[] {
		return (this.core.bulk ?? []).filter(bulkMeta => bulkMeta.threshold);
	}
	public get bulkThresholdDelta(): number {
		let delta = 0;
		(this.core.bulk || []).forEach(bulkMeta => delta += bulkMeta.threshold || 0);
		return delta;
	}

	/**************************************************************************************************************************/
	// Class Traits

	public get classPath(): string | undefined {
		return this.core.classPath;
	}

	/**************************************************************************************************************************/
	// Feats

	public get feat(): string | undefined {
		const featMeta = this.core.feat;
		return featMeta ? (featMeta.given ?? featMeta.selected) : undefined;
	}
	public get featMeta(): IMetadataFeat | undefined {
		return this.core.feat;
	}
	public get featNeeded(): boolean {
		return this.featSelectable && !this.core.feat?.selected;
	}
	public get featSelectable(): boolean {
		const featMeta = this.core.feat;
		return featMeta ? !!(featMeta.filterLevel || featMeta.filterTrait || (featMeta.options || []).length) : false;
	}
	public selectFeat(feat: string): void {
		if (this.core.feat) {
			this.core.feat.selected = feat;
		}
	}

	/**************************************************************************************************************************/
	// Hit Points

	public get hitPoints(): IMetadataHitPoints[] {
		return this.core.hitPoints || [];
	}

	/**************************************************************************************************************************/
	// Languages

	public get languages(): string[] {
		return (this.core.languages || []).reduce((languages, languagesMeta) => {
			languages.push(...(languagesMeta.given || []));
			if (languagesMeta.selected) {
				languages.push(languagesMeta.selected);
			}
			return languages;
		}, <string[]>[]);
	}

	/**************************************************************************************************************************/
	// Proficiencies

	public get proficiencies(): IMetadataProficiency[] {
		return (this.core.proficiencies || []).filter(proficiency => proficiency.proficiency && (proficiency.given || proficiency.selected));
	}
	public getProficiencies(subject: string): TProficiency[] {
		return (this.core.proficiencies ?? [])
			.filter(proficiencyMeta => proficiencyMeta.proficiency && (proficiencyMeta.given === subject || proficiencyMeta.selected === subject))
			.map(proficiencyMeta => proficiencyMeta.proficiency);
	}
	public get canSelectSkill(): boolean {
		return (this.core.proficiencies || []).find(proficiencyMeta => !proficiencyMeta.given) !== undefined;
	}
	public get needsSkillSelection(): boolean {
		return (this.core.proficiencies ?? []).find(proficiencyMeta => proficiencyMeta.proficiency && !proficiencyMeta.given && !proficiencyMeta.selected) !== undefined;
	}
	public get skills(): IMetadataProficiency[] {
		return (this.core.proficiencies ?? []).filter(proficiencyMeta => proficiencyMeta.category === "Skill");
	}

	/**************************************************************************************************************************/
	// Senses

	public get senses(): string[] { return this.core.senses ?? []; }

	/**************************************************************************************************************************/
	// Size

	public get size(): TSize | undefined { return this.core.size; }

	/**************************************************************************************************************************/
	// Speeds

	public get speedBurrow(): number {
		const speed = (this.core.speeds || []).find(spd => spd.type === "Burrow");
		return speed && speed.value || 0;
	}
	public get speedClimb(): number {
		const speed = (this.core.speeds || []).find(spd => spd.type === "Climb");
		return speed && speed.value || 0;
	}
	public get speedFly(): number {
		const speed = (this.core.speeds || []).find(spd => spd.type === "Fly");
		return speed && speed.value || 0;
	}
	public get speedLand(): number {
		const speed = (this.core.speeds || []).find(spd => spd.type === "Land");
		return speed && speed.value || 0;
	}
	public get speedSwim(): number {
		const speed = (this.core.speeds || []).find(spd => spd.type === "Swim");
		return speed && speed.value || 0;
	}
}
