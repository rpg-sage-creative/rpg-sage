import { Collection } from "../../sage-utils/utils/ArrayUtils";
import type { TProficiency } from "../common";
import type { SourcedCore } from "./base/HasSource";
import HasSource from './base/HasSource';
import Source from './base/Source';
import type { FeatureCore } from "./Feature";
import Feature from './Feature';
import type { FeatureLevelCore } from "./Features";
import Features from './Features';

/** Returns the highest Skill Proficiency you can have at the given level. */
function levelToSkillIncreaseMaxProficiency(level: number): TProficiency {
	if (level >= 15) {
		return "Legendary";
	}
	if (level >= 7) {
		return "Master";
	}
	if (level >= 2) {
		return "Expert";
	}
	return "Trained";
}

export interface ClassCore extends SourcedCore {
	objectType: "Class";
	classPath: string;
	features: FeatureCore[];
	classFeats: number[];
	skillFeats: number[];
	generalFeats: number[];
	skillIncreases: number[];
	spellsPerDay: number[][];
}

export default class Class extends HasSource<ClassCore> {
	/**************************************************************************************************************************/
	// Constructor

	public constructor(core: ClassCore) {
		super(core);
		const levels: FeatureLevelCore[] = [];
		const featureCores = core.features ?? [];
		for (let index = 0; index < 20; index++) {
			levels.push({ level: index+1, features:featureCores.filter(feature=>feature.level===index+1) });
		}
		this.features = new Features(levels);
	}

	/**************************************************************************************************************************/
	// Properties

	public get classPath(): string { return this.core.classPath; }
	public features: Features;

	/**************************************************************************************************************************/
	// Instance Methods

	public getClassFeats(level: number): Feature[] {
		if (this.core.classFeats.includes(level)) {
			return [Class.createFeat(level, Class.FeatureObjectType, Class.ClassFeatName, this.name)];
		}
		return [];
	}
	public getSkillFeats(level: number): Feature[] {
		if (this.core.skillFeats.includes(level)) {
			return [Class.createFeat(level, Class.LevelFeatureObjectType, Class.SkillFeatName, "Skill")];
		}
		return [];
	}
	public getGeneralFeats(level: number): Feature[] {
		if (this.core.generalFeats.includes(level)) {
			return [Class.createFeat(level, Class.LevelFeatureObjectType, Class.GeneralFeatName, "General")];
		}
		return [];
	}
	public getSkillIncreases(level: number): Feature[] {
		if (this.core.skillIncreases.includes(level)) {
			return [Class.createSkillIncrease(Class.LevelFeatureObjectType, level)];
		}
		return [];
	}

	/**************************************************************************************************************************/
	// Static Methods

	public static FeatureObjectType = "ClassFeature";
	public static IntelligenceFeatureObjectType = "IntelligenceFeature";
	public static LevelFeatureObjectType = "LevelFeature";

	public static ClassFeatName = "Class Feat";
	public static SkillFeatName = "Skill Feat";
	public static GeneralFeatName = "General Feat";

	public static SkillIncreaseName = "Skill Increase";

	public static createFeat(level: number, objectType: string, name: string, trait: string): Feature {
		return new Feature({
			// TODO: why am i not giving this a UUID? cause the object is temp???
			id: undefined!,
			objectType: <"Feature">objectType,
			level: level,
			name: name,
			metadata: {
				feat: {
					filterLevel: level,
					filterTrait: trait
				}
			},
			source: Source.CoreCode,
			traits: undefined
		});
	}
	public static createSkillIncrease(objectType: string, level: number): Feature {
		return new Feature({
			// TODO: why am i not giving this a UUID
			id: undefined!,
			objectType: <"Feature">objectType,
			level: level,
			name: Class.SkillIncreaseName,
			metadata: {
				proficiencies: [
					{
						proficiency: levelToSkillIncreaseMaxProficiency(level),
						category: "Skill"
					}
				]
			},
			source: Source.CoreCode,
			traits: undefined
		});
	}

	public static removeFeatures(features: FeatureCore[]): FeatureCore[] {
		return Collection.remove(features, feature => feature.objectType === Class.FeatureObjectType);
	}
	public static replaceFeatures(level: FeatureLevelCore, klass: Class): void {
		Class.removeFeatures(level.features);
		if (!klass) {
			return;
		}

		level.features.push(...klass.features.get(level.level).map(feature => feature.toJSON()));
		level.features.push(...klass.getClassFeats(level.level).map(feature => feature.toJSON()));

		const newSkillFeats = klass.getSkillFeats(level.level),
			existingSkillFeats = level.features.filter(feature => feature.objectType === Class.LevelFeatureObjectType && feature.name === Class.SkillFeatName);
		let newSkillFeatCount = newSkillFeats.length,
			existingSkillFeatCount = existingSkillFeats.length;
		while (newSkillFeatCount > existingSkillFeatCount) {
			level.features.push(Class.createFeat(level.level, Class.LevelFeatureObjectType, Class.SkillFeatName, "Skill").toJSON());
			newSkillFeatCount--;
		}
		while (newSkillFeatCount < existingSkillFeatCount) {
			level.features.splice(level.features.indexOf(existingSkillFeats.pop()!), 1);
			existingSkillFeatCount--;
		}

		const newGeneralFeats = klass.getGeneralFeats(level.level),
			existingGeneralFeats = level.features.filter(feature => feature.objectType === Class.LevelFeatureObjectType && feature.name === Class.GeneralFeatName);
		let newGeneralFeatCount = newGeneralFeats.length,
			existingGeneralFeatCount = existingGeneralFeats.length;
		while (newGeneralFeatCount > existingGeneralFeatCount) {
			level.features.push(Class.createFeat(level.level, Class.LevelFeatureObjectType, Class.GeneralFeatName, "General").toJSON());
			newGeneralFeatCount--;
		}
		while (newGeneralFeatCount < existingGeneralFeatCount) {
			level.features.splice(level.features.indexOf(existingGeneralFeats.pop()!), 1);
			existingGeneralFeatCount--;
		}

		const newSkillIncreases = klass.getSkillIncreases(level.level),
			existingSkillIncreases = level.features.filter(feature => feature.objectType === Class.LevelFeatureObjectType && feature.name === Class.SkillIncreaseName);
		let newSkillIncreaseCount = newSkillIncreases.length,
			existingSkillIncreaseCount = existingSkillIncreases.length;
		while (newSkillIncreaseCount > existingSkillIncreaseCount) {
			level.features.push(Class.createSkillIncrease(Class.LevelFeatureObjectType, level.level).toJSON());
			newSkillIncreaseCount--;
		}
		while (newSkillIncreaseCount < existingSkillIncreaseCount) {
			level.features.splice(level.features.indexOf(existingSkillIncreases.pop()!), 1);
			existingSkillIncreaseCount--;
		}
	}

}
