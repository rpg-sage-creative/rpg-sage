import type { Core } from "../../../sage-utils/ClassUtils";
import type { StringMatcher } from "../../../sage-utils/StringUtils";
import type { TRarity } from "../../common";
import type { Base, BaseCore } from "./Base";

// #region DetailedCore core interface and HasDetails class interface

export type TDetailObject = { [key: string]: string[]; };

export type THasSuccessOrFailure = {
	criticalSuccess?: string[];
	success?: string[];
	failure?: string[];
	criticalFailure?: string[];
	followUp?: string[];
};

export type TDetail = string | TDetailObject;

export interface DetailedCore<T extends string = string> extends Core<T>, THasSuccessOrFailure {
	description?: string;
	details?: TDetail[];
}

export interface IHasDetails {
	description: string;
	details: TDetail[];
	hasDescription: boolean;
	hasDetails: boolean;
	hasSuccessOrFailure: boolean;
}

export type TDetailFormatter = (detail: TDetail, index: number, array: string[]) => string;

// #endregion DetailedCore core interface and HasDetails class interface

// #region ArchivedCore core interface and IHasArchives class interface

export interface ArchivedCore {
	aonId?: number;
	aonTraitId?: number;
}

export interface IHasArchives {
	aonId?: number;
	aonTraitId?: number;
	toAonLink(): string;
}

// #endregion ArchivedCore core interface and IHasArchives class interface

//#region Non AoN links (primarily 3PP support)

export interface LinkedCore {
	url?: string;
}

export interface IHasLink {
	url?: string;
	toLink(): string;
}

//#endregion

// #region NamedCore core interface and IHasName class interface

export interface NamedCore {
	name: string;
}

export interface IHasName {

	/** The object's name. */
	name: string;

	/** this.name.toLowerCase(); used to allow caching */
	nameLower: string;

	/** This must check to see if the value matches the name, nameClean (when cleaned), or nameLower (when lowered) */
	matches(value: StringMatcher): boolean;
}

// #endregion NamedCore core interface and IHasName class interface

// #region IHasChildren

export interface ParentCore<T extends BaseCore> {
	children: T[];
}

export interface IHasChildren<T extends Base<BaseCore>> {
	children: T[];
	hasChildren: boolean;
}

// #endregion ParentCore

// #region IHasTraits

export interface TraitsCore {
	traits?: string[];
}

export interface IHasTraits {
	hasNonRarityTraits: boolean;
	hasTraits: boolean;
	nonRarityTraits: string[];
	traits: string[];
	includesTrait(trait: string): boolean;
}

// #endregion IHasTraits

//#region IHasRarity

export interface RarityCore {
	rarity?: TRarity;
}

export interface IHasRarity {
	isNotCommon: boolean;
	rarity: TRarity;
}

//#endregion
