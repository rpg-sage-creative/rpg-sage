import { exists } from "../../sage-utils/utils/ArrayUtils/Filters";
import { sortAscending } from "../../sage-utils/utils/ArrayUtils/Sort";
import type { TProficiency } from "../common";
import { ARMOR_UNARMORED, profToMod, TRAINED, UNTRAINED } from "../common";
import { findById, findByValue } from "../data/Repository";
import type Feat from "./Feat";
import type { FeatureCore } from "./Feature";
import Feature from "./Feature";
import type { IHasMetadata } from "./Metadata";

export type TFeatureFilter = (feature: Feature, level: number) => boolean;
export type TFeatureIterator = (feature: Feature, level: number) => void;
export type TFeatureMapper<T> = (feature: Feature, level: number) => T;

export interface FeatureLevelCore {
	features: FeatureCore[];
	level: number;
}

export default class Features {
	public constructor(protected levels: FeatureLevelCore[]) { }

	public add(...features: Feature[]): void {
		this.levels.slice(-1)[0].features.push(...features.map(feature => feature.toJSON()));
	}
	public addTo(level: number, ...features: Feature[]): void {
		this.levels.find(featureLevel => featureLevel.level === level)!
			.features.push(...features.map(feature => feature.toJSON()));
	}
	public addOrReplace(feature: Feature, level: number): void {
		if (!this.replace(feature)) {
			this.levels.find(featureLevel => featureLevel.level === level)!
				.features.push(feature.toJSON());
		}
	}

	public filter(filter: TFeatureFilter): Feature[];
	public filter(objectType: string): Feature[];
	public filter(objectType: string, filter: TFeatureFilter): Feature[];
	public filter(objectType: string, featureName: string): Feature[];
	public filter(objectType: string, featureName: string, filter: TFeatureFilter): Feature[];
	public filter(...args: any[]): Feature[] {
		return this.map(args[0], args[1], args[2], feature => feature);
	}

	public find(featureId: string): Feature;
	public find(objectType: string): Feature;
	public find(filter: TFeatureFilter): Feature;
	public find(stringOrFilter: string | TFeatureFilter): Feature | undefined {
		const string = typeof (stringOrFilter) === "string" ? stringOrFilter : null,
			filter = typeof (stringOrFilter) === "function" ? stringOrFilter : null;
		for (const level of this.levels) {
			for (const featureCore of level.features) {
				const feature = new Feature(featureCore);
				if (string && (featureCore.objectType === string || feature.id === string)) {
					return feature;
				}
				if (filter && filter(feature, level.level)) {
					return feature;
				}
			}
		}
		return undefined;
	}

	public forEach(iterator: TFeatureIterator): void;
	public forEach(filter: TFeatureFilter, iterator: TFeatureIterator): void;
	public forEach(objectType: string, iterator: TFeatureIterator): void;
	public forEach(objectType: string, filter: TFeatureFilter, iterator: TFeatureIterator): void;
	public forEach(objectType: string, featureName: string, iterator: TFeatureIterator): void;
	public forEach(objectType: string, featureName: string, filter: TFeatureFilter, iterator: TFeatureIterator): void;
	public forEach(...args: any[]): void {
		this.map(args[0], args[1], args[2], args[3]);
	}

	public get(level: number): Feature[] {
		const featureLevel = this.levels.find(fLevel => fLevel.level === level);
		return (featureLevel?.features ?? []).map(featureCore => new Feature(featureCore));
	}

	public getFeats(): Feat[] {
		return this.map(feature => feature.hasMetadata && feature.metadata.feat !== null,
			feature => findById<Feat>(feature.metadata.feat) ?? findByValue("Feat", feature.metadata.feat)!);
	}

	public getLevel(level: number): Features {
		const featureLevel = this.levels.find(fLevel => fLevel.level === level);
		return new Features(featureLevel ? [featureLevel] : []);
	}

	public getMetadata(): IHasMetadata[] {
		return (<IHasMetadata[]>this.filter(feature => feature.hasMetadata))
			.concat(<IHasMetadata[]>this.getFeats().filter(feat => feat.hasMetadata));
	}

	public getProficiency(subject: string): TProficiency {
		const featureProficiencies = this.map(feature => feature.hasMetadata, feature => feature.metadata.getProficiencies(subject)).flat(Infinity) as TProficiency[],
			featProficiencies = this.getFeats().filter(feat => feat.hasMetadata).map(feature => feature.metadata.getProficiencies(subject)).flat(Infinity) as TProficiency[],
			proficiencies = featureProficiencies.concat(featProficiencies);
		proficiencies.sort((aProf, bProf) => sortAscending(profToMod(aProf), profToMod(bProf)));
		const proficiency = proficiencies.pop();
		if (!proficiency && subject === ARMOR_UNARMORED) {
			return TRAINED;
		}
		return proficiency ?? UNTRAINED;
	}

	// public map<T>(...args: any[]): T[];
	public map<T>(mapper: TFeatureMapper<T>): T[];
	public map<T>(filter: TFeatureFilter, mapper: TFeatureMapper<T>): T[];
	public map<T>(objectType: string, mapper: TFeatureMapper<T>): T[];
	public map<T>(objectType: string, filter: TFeatureFilter, mapper: TFeatureMapper<T>): T[];
	public map<T>(objectType: string, featureName: string, mapper: TFeatureMapper<T>): T[];
	public map<T>(objectType: string, featureName: string, filter: TFeatureFilter, mapper: TFeatureMapper<T>): T[];
	public map<T>(...args: (string | TFeatureFilter | TFeatureMapper<T>)[]): T[] {
		args = args.filter(exists);
		const mapper = <TFeatureMapper<T>>args.pop(),
			strings = <string[]>args.filter(arg => typeof (arg) === "string"),
			objectType = strings[0],
			featureName = strings[1],
			filter = <TFeatureFilter>args.find(arg => typeof (arg) === "function"),
			mapped: T[] = [];
		this.levels.forEach(level => {
			level.features.forEach(featureCore => {
				if (objectType && featureCore.objectType !== objectType) {
					return;
				}
				if (featureName && featureCore.name !== featureName) {
					return;
				}
				const feature = new Feature(featureCore);
				if (!filter || filter(feature, level.level)) {
					mapped.push(mapper(feature, level.level));
				}
			});
		});
		return mapped;
	}

	public remove(...features: Feature[]): void {
		features.forEach(feature => {
			for (const featureLevel of this.levels) {
				for (let index = 0, length = featureLevel.features.length; index < length; index++) {
					const featureCore = featureLevel.features[index];
					if (feature.is(featureCore)) {
						featureLevel.features.splice(index, 1);
						return;
					}
				}
			}
		});
	}

	public replace(feature: Feature): boolean {
		for (const featureLevel of this.levels) {
			for (let index = 0, length = featureLevel.features.length; index < length; index++) {
				const featureCore = featureLevel.features[index];
				if (featureCore.objectType === feature.objectType && featureCore.name === feature.name && featureCore.level === feature.level) {
					featureLevel.features.splice(index, 1, feature.toJSON());
					return true;
				}
			}
		}
		return false;
	}
}
