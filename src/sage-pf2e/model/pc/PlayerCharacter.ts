import type { Optional } from "../../../sage-utils";
import { asStringIgnoreCase, unique } from "../../../sage-utils/ArrayUtils";
import { HasIdCore, IdCore } from "../../../sage-utils/ClassUtils";
import { UUID, generate } from "../../../sage-utils/UuidUtils";
import type { TAbility, TAlignment, TProficiency, TSize } from "../../common";
import { PERCEPTION, WISDOM, profToMod } from "../../common";
import { findById, findByValue } from "../../data";
import type { Action } from "../Action";
import { Ancestry } from "../Ancestry";
import { Background } from "../Background";
import { Class } from "../Class";
import type { Deity } from "../Deity";
import type { Feature, FeatureCore } from "../Feature";
import type { FeatureLevelCore } from "../Features";
import { Features } from "../Features";
import { Heritage } from "../Heritage";
import { Language } from "../Language";
import type { IHasMetadata } from "../Metadata";
import type { Spell } from "../Spell";
import type { IWealth } from "../Wealth";
import { Wealth } from "../Wealth";
import type { IHasAbilities } from "./Abilities";
import { Abilities } from "./Abilities";
import { ArmorClasses } from "./ArmorClasses";
import { Check } from "./Check";
import { Encumbrance } from "./Encumbrance";
import type { IEquipment } from "./Equipment";
import { Equipment } from "./Equipment";
import type { IHasSavingThrows } from "./SavingThrows";
import { SavingThrows } from "./SavingThrows";
import { Skills } from "./Skills";
import { Speeds } from "./Speeds";

//#region Interfaces & Types

interface IPlayerCharacterBio {
	age: number;
	alignment: TAlignment;
	characterName: string;
	deityId?: UUID;
	// languages: string[];
	objectType: "Bio";
	playerName: string;
	pronouns: string;
	xp: number;
}

interface IPlayerCharacterPoints {
	heroPoints: number;
	hitPoints: number;
	objectType: "Points";
	focusPoints: number;
	tempHitPoints: number;
}

export interface PlayerCharacterCore extends IdCore<"PlayerCharacter"> {
	background?: string;
	bio: IPlayerCharacterBio;
	class?: string;
	conditions: FeatureCore[];
	effects: FeatureCore[];
	equipment: IEquipment;
	heritage?: string;
	levels: FeatureLevelCore[];
	points: IPlayerCharacterPoints;
	wealth: IWealth;
}

//#endregion

//#region Level Features helpers

function pushHeritageToFeatures(features: Feature[], heritage: Optional<Heritage>, level: number): void {
	if (heritage) {
		features.push(...heritage.ancestry.features.get(level));
		features.push(...heritage.features.get(level));
		features.push(...heritage.ancestry.getAncestryFeats(level));
	}
}

function pushBackgroundToFeatures(features: Feature[], background: Optional<Background>, level: number): void {
	if (background) {
		features.push(...background.features.get(level));
	}
}

function pushClassToFeatures(features: Feature[], klass: Optional<Class>, level: number): void {
	if (klass) {
		features.push(...klass.features.get(level));
		features.push(...klass.getClassFeats(level));
		features.push(...klass.getSkillFeats(level));
		features.push(...klass.getGeneralFeats(level));
		features.push(...klass.getSkillIncreases(level));
	}
}

//#endregion

export interface IHasProficiencies {
	getProficiency(subject: string): TProficiency;
	getProficiencyMod(subject: string): number;
}

export class PlayerCharacter extends HasIdCore<PlayerCharacterCore, "PlayerCharacter"> implements IHasAbilities, IHasProficiencies, IHasSavingThrows {
	private _background?: Background;
	private _class?: Class;
	private _deity?: Deity;
	private _heritage?: Heritage;

	//#region Constructor

	public constructor(core: PlayerCharacterCore = <any>{}) {
		super(core);
		if (!core.bio) {
			core.bio = <any>{};
		}
		if (!core.id) {
			core.id = generate();
		}
		if (!core.effects) {
			core.effects = [];
		}
		if (!core.equipment) {
			core.equipment = <any>{};
		}
		if (!core.levels) {
			core.levels = [{ level: 1, features: [] }];
		}
		if (!core.points) {
			core.points = <any>{};
		}
		if (!core.wealth) {
			core.wealth = <any>{ coins: { sp: 150 } };
		}

		this.abilities = Abilities.for(this);
		this.armorClasses = new ArmorClasses(this);
		this.encumbrance = new Encumbrance(this);
		this.equipment = new Equipment(this, this.core.equipment);
		this.features = new Features(this.core.levels);
		this.savingThrows = SavingThrows.for(this);
		this.skills = new Skills(this);
		this.speeds = new Speeds(this);
		this.wealth = new Wealth(core.wealth);

		this._background = findByValue("Background", this.core.background);
		this._class = findByValue("Class", this.core.class);
		this._deity = findById(this.bio.deityId);
		this._heritage = findByValue("Heritage", this.core.heritage);

		// TODO: Global PC cache? --> PlayerCharacter.LoadedPlayerCharacters.push(this);
	}

	//#endregion

	//#region Properties

	public abilities: Abilities;
	public get actions(): Action[] {
		return (this.features.getMetadata().map(meta => meta.metadata.actions).flat(Infinity) as string[])
			.filter(unique)
			.map(action => findByValue("Action", action)!);
	}
	public get activeSpells(): Spell[] {
		return [];
	}
	public get archetypes(): string[] {
		return this.features.getFeats().filter(feat => feat.traits.includes("Dedication")).map(feat => feat.name.replace(/ Dedication/, ""));
	}
	public armorClasses: ArmorClasses;
	public get background(): Background | undefined {
		return this._background;
	}
	public set background(background: Background | undefined) {
		if (this._background !== background) {
			this._background = background;
			this.core.background = background?.name;
			this.core.levels.forEach(level => Background.replaceFeatures(level, background));
			this.update();
		}
	}
	public get bio(): IPlayerCharacterBio {
		return this.core.bio;
	}
	public get class(): Class | undefined {
		return this._class;
	}
	public set class(klass: Class | undefined) {
		if (this._class !== klass) {
			this._class = klass;
			this.core.class = klass?.name;
			this.core.levels.forEach(level => Class.replaceFeatures(level, klass!));
			this.update();
		}
	}
	public get classes(): string[] {
		return (this.class && [this.class.name] || []).concat(this.archetypes);
	}
	public get classPath(): string | undefined {
		const feature = this.features.getMetadata().find(f => f.metadata.classPath !== null);
		return feature?.metadata.classPath;
	}
	public get deity(): Deity | undefined {
		return this._deity;
	}
	public set deity(deity: Deity | undefined) {
		if (this._deity !== deity) {
			this._deity = deity;
			this.bio.deityId = deity?.id;
			this.update();
		}
	}
	public encumbrance: Encumbrance;
	public equipment: Equipment;
	public features: Features;
	public get heritage(): Heritage | undefined {
		return this._heritage;
	}
	public set heritage(heritage: Heritage | undefined) {
		if (this._heritage !== heritage) {
			this._heritage = heritage;
			this.core.heritage = heritage?.name;
			this.core.levels.forEach(level => Heritage.replaceFeatures(level, heritage!));
			this.update();
		}
	}
	public get isProne(): boolean {
		return this.core.effects.find(effect => effect.name === "Prone") !== undefined;
	}
	public set isProne(value: boolean) {
		const index = this.core.effects.findIndex(effect => effect.name === "Prone");
		if (!value) {
			if (-1 < index) {
				this.core.effects.splice(index, 1);
				this.update();
			}
		} else {
			if (index < 0) {
				this.core.effects.push({
					// TODO: temp affect doesn't need ID?
					id: undefined!,
					"name": "Prone",
					"objectType": "Feature",
					"level": this.level,
					"metadata": {},
					// TODO: temp affect doesn't need source?
					source: undefined!,
					traits: undefined
				});
				this.update();
			}
		}
	}
	public get languages(): Language[] {
		const languages = (this.features.getMetadata().map(feature => feature.metadata.languages)
			.flat(Infinity) as string[])
			.filter(unique);
		return languages.map(language => findByValue("Language", language))
			.sort(asStringIgnoreCase) as Language[];
	}
	public set languages(languages: Language[]) {
		const languageNames = languages.map(language => language.name),
			features = this.features.filter(Language.FeatureObjectType, Language.LanguagesName);
		this.features.remove(...features);

		const existingLanguageNames = this.languages.map(language => language.name),
			newLanguages = languageNames.filter(language => !existingLanguageNames.includes(language));
		this.features.add(Language.createFeature(this.level, newLanguages));

		this.update();
	}
	public get level(): number {
		return this.core.levels.length;
	}
	public set level(newLevel: number) {
		if (newLevel < this.core.levels.length) {
			this.core.levels.length = newLevel;
		} else {
			for (let i = 0; i < newLevel; i++) {
				if (!this.core.levels[i]) {
					const levelValue = i + 1,
						features: Feature[] = [],
						heritage = this.heritage,
						background = this.background,
						klass = this.class;
					pushHeritageToFeatures(features, heritage, levelValue);
					pushBackgroundToFeatures(features, background, levelValue);
					pushClassToFeatures(features, klass, levelValue);
					this.core.levels[i] = {
						level: levelValue,
						features: features.map(feature => feature.toJSON())
					};
				}
			}
		}
		this.update();
	}
	public get levelByXP(): number {
		return Math.floor((this.bio.xp || 0) / 1000) + 1;
	}
	public get maxHitPoints(): Check {
		const check = new Check(this, "MaxHitPoints"),
			conMod = this.abilities.conMod,
			level = this.level;
		this.features.forEach(Ancestry.FeatureObjectType, feature => feature.hasMetadata, iterator);
		this.features.forEach(Heritage.FeatureObjectType, feature => feature.hasMetadata, iterator);
		this.features.forEach(Background.FeatureObjectType, feature => feature.hasMetadata, iterator);
		this.features.forEach(Class.FeatureObjectType, feature => feature.hasMetadata, iterator);
		check.addUntypedModifier(`ConMod x Level`, conMod * level);
		this.features.getMetadata().filter(filter).forEach(iterator);
		return check;

		function filter(hasMetadata: IHasMetadata): boolean {
			return hasMetadata.hasMetadata
				&& ![Ancestry.FeatureObjectType, Heritage.FeatureObjectType, Background.FeatureObjectType, Class.FeatureObjectType].includes(hasMetadata.objectType);
		}
		function iterator(hasMetadata: IHasMetadata): void {
			hasMetadata.metadata.hitPoints.forEach(hitPoints => {
				if (hitPoints.max) {
					check.addUntypedModifier(hasMetadata.name, hitPoints.max);
				}
				if (hitPoints.maxPerLevel) {
					check.addUntypedModifier(hasMetadata.name, Math.max(hitPoints.maxPerLevel * level, hitPoints.perLevelMin || 0));
				}
			});
		}
	}
	public get perception(): Check {
		const check = new Check(this, PERCEPTION);
		check.setAbility(WISDOM);
		check.addProficiency(PERCEPTION);
		return check;
	}
	public get points(): IPlayerCharacterPoints {
		return this.core.points;
	}
	public savingThrows: SavingThrows;
	public get senses(): string[] {
		const senses: string[] = [];
		this.features.forEach(feature => feature.hasMetadata, feature => senses.push(...feature.metadata.senses));
		return senses;
	}
	public get size(): TSize | undefined {
		const features = this.features.filter(feature => feature.hasMetadata && feature.metadata.size !== null);
		/*// console.warn("//TODO: Look at conditions for a different size!");*/
		return features.pop()?.metadata.size;
	}
	public skills: Skills;
	public speeds: Speeds;
	public wealth: Wealth;

	//#endregion

	//#region Instance Methods

	public filterConditions(filter: (value: FeatureCore, index: number, obj: FeatureCore[]) => unknown): FeatureCore[] {
		const conditions = this.core.conditions ?? [];
		return filter ? conditions.filter(filter) : conditions;
	}
	public filterEffects(filter: (value: FeatureCore, index: number, obj: FeatureCore[]) => unknown): FeatureCore[] {
		const effects = this.core.effects ?? [];
		return filter ? effects.filter(filter) : effects;
	}
	public getClassDC(klass: string | undefined = this.class?.name): Check {
		const check = new Check(this, "ClassDC");
		check.level = this.class && klass === this.class.name ? this.level : 0;
		check.setAbility(this.abilities.getKeyAbility(klass));
		return check;
	}
	public getProficiency(subject: string): TProficiency {
		return this.features.getProficiency(subject);
	}
	public getProficiencyMod(subject: string): number {
		return this.level + profToMod(this.getProficiency(subject));
	}
	public save(): void {
		/*// PlayerCharacter.save(this.id, this.core);*/
	}
	public setAbilityScores(features: Feature[]): void {
		features.forEach(newFeature => {
			this.features.addOrReplace(newFeature, newFeature.level);
		});

		//#region (Re)Calculate bonus skills from Int
		const intMod = this.abilities.intMod,
			intSkills = this.features.filter(Class.IntelligenceFeatureObjectType, Class.SkillIncreaseName),
			intSkillsLength = intSkills.length;
		let delta = intMod - intSkillsLength;
		if (0 < delta) {
			for (let index = 0; index < delta; index++) {
				this.features.addTo(1, Class.createSkillIncrease(Class.IntelligenceFeatureObjectType, 1));
			}
		} else if (intSkillsLength && delta < 0) {
			do {
				this.features.remove(intSkills.pop()!);
			} while (++delta < 0);
		}
		//#endregion

		this.update();
	}
	public testPrerequisites(prerequisites: string[]): boolean {
		for (const prerequisite of prerequisites) {
			const abilityScore = prerequisite.match(/(Strength|Constitution|Dexterity|Intelligence|Wisdom|Charisma)(?: or (Strength|Constitution|Dexterity|Intelligence|Wisdom|Charisma))? (\d+)/);
			if (abilityScore) {
				const abilityOne = <TAbility>abilityScore[1],
					abilityTwo = <TAbility>abilityScore[2],
					score = +abilityScore[3];
				if (this.abilities.getAbilityScore(abilityOne) < score && (!abilityTwo || this.abilities.getAbilityScore(abilityTwo) < score)) {
					return false;
				}
				continue;
			}
			const trainedIn = prerequisite.replace(/ saves$/, "").match(/(trained|expert|master|legendary) in ([^$]+)$/i);
			if (trainedIn) {
				const proficiencyRequired = <TProficiency>trainedIn[1],
					subject = trainedIn[2],
					proficiency = this.getProficiency(subject);
				if (profToMod(proficiency) < profToMod(proficiencyRequired)) {
					return false;
				}
				/*continue;*/
			}
			// console.log(prerequisite)
		}
		return true;
	}
	public update(): void {
		this.save();
		/*// PlayerCharacter.broadcast(this, "updated");*/
	}

	//#endregion

	//#region Static Methods

	// public static LoadedPlayerCharacters = <PlayerCharacter[]>[];

	/** Broadcasts the character to all listeners. */
	// public static async broadcast(pc: PlayerCharacter, action: "updated"): Promise<boolean> {
	// 	// EventHandler.fireEvent("pc-updated", this);
	// 	console.warn("PlayerCharacter.broadcast(): Not Implemented!");
	// 	return false;
	// }

	/** Saves the character's core.  */
	// public static async save(id: UUID, core: IPlayerCharacter): Promise<boolean> {
	// 	console.warn("PlayerCharacter.save(): Not Implemented!");
	// 	return false;
	// }

	//#endregion
}
