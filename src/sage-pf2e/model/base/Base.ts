import { sortPrimitive, type Comparable, type SortResult } from "@rsc-utils/array-utils";
import { HasIdCore, type IdCore } from "@rsc-utils/class-utils";
import { warn } from "@rsc-utils/core-utils";
import type { Renderable, RenderableContent as UtilsRenderableContent } from "@rsc-utils/render-utils";
import { SearchInfo, SearchScore, Searchable } from "@rsc-utils/search-utils";
import { StringMatcher } from "@rsc-utils/string-utils";
import { NEWLINE, TAB } from "../../common";
import { RenderableContent } from "../../data/RenderableContent";
import type {
	ArchivedCore,
	DetailedCore,
	IHasArchives,
	IHasDetails,
	IHasLink,
	IHasName,
	LinkedCore,
	NamedCore,
	TDetail,
	THasSuccessOrFailure
} from "./interfaces";

function isSuccessFailureDetail(detail: TDetail | THasSuccessOrFailure): detail is THasSuccessOrFailure {
	return ((<THasSuccessOrFailure>detail).success?.length ?? 0) > 0
		|| ((<THasSuccessOrFailure>detail).failure?.length ?? 0) > 0
		|| ((<THasSuccessOrFailure>detail).criticalSuccess?.length ?? 0) > 0
		|| ((<THasSuccessOrFailure>detail).criticalFailure?.length ?? 0) > 0;
}

/**
 * Used to determine if a detail paragraph needs a tab or newline before it when combining details.
 * Used in .appendDetailsTo()
*/
function tabNewLineOrEmpty(index: number, wasBlock: boolean): "\t" | "\n" | "" {
	// If we aren't on the first (0) index, then we always tab.
	if (index) {
		return TAB;
	}
	// If the previous detail was a blockquote, we don't need a newline.
	if (wasBlock) {
		return "";
	}
	// Otherwise, we need a newline.
	return NEWLINE;
}

export interface BaseCore<T extends string = string> extends IdCore<T>, ArchivedCore, DetailedCore<T>, LinkedCore, NamedCore { }

type TChildCoreParser<T extends BaseCore> = (core: T) => T[];
export class Base<T extends BaseCore<U> = BaseCore<any>, U extends string = string>
	extends
		HasIdCore<T, U>
	implements
		IHasArchives,
		Comparable<Base<T, U>>,
		IHasDetails,
		IHasLink,
		IHasName,
		Renderable,
		Searchable {

	// #region Constructor

	public constructor(protected core: T) {
		super(core);
		if (!core.id && !((core as any).hash)) {
			warn("NO ID!", core.name ?? core);
		}
	}

	// #endregion Constructor

	// #region Instance Methods

	public toString(): string {
		return this.core.name;
	}

	// #endregion

	// #region static

	/** Represents the objectType in Archives of Nethys */
	public static get aon(): string {
		return this.plural;
	}

	/** Represents the type in PF2 Tools */
	public static get pf2Tools(): string {
		return this.singular.toLowerCase();
	}

	/** Represents the objectType */
	public static get singular(): string {
		return this.name;
	}

	/** Represents the plural form of the objectType */
	public static get plural(): string {
		const singular = this.singular;
		const match = singular.match(/(ss|y)^/);
		switch(match?.[1]) {
			case "ss": return singular + "es";
			case "y": return singular.slice(0, -1) + "ies";
			default: return this.singular + "s";
		}
	}

	public static childParser: TChildCoreParser<BaseCore>;

	// #endregion static

	// #region IHasArchives

	public get aonId(): number | undefined { return this.core.aonId; }
	public get aonTraitId(): number | undefined { return this.core.aonTraitId; }

	public toAonLink(): string;
	public toAonLink(label: string): string;
	public toAonLink(searchResult: true): string;
	public toAonLink(label: boolean | string = this.name): string {
		const objectType = (this.constructor as typeof Base).aon ?? (this.constructor as typeof Base).plural,
			aonId = this.aonId;
		if (objectType && aonId) {
			if (label === true) {
				return `<a href="https://2e.aonprd.com/${objectType}.aspx?ID=${aonId}">(link)</a>`;
			}
			return `<a href="https://2e.aonprd.com/${objectType}.aspx?ID=${aonId}">View ${label} on Archives of Nethys</a>`;
		} else if (!this.url) {
			return `<a href="http://2e.aonprd.com/Search.aspx?query=${(label as string).replace(/\s+/g, "+")}">Search ${label} on Archives of Nethys</a>`;
		}
		return "";
	}

	// #endregion IHasArchives

	// #region IHasLink

	public get url(): string | undefined { return this.core.url; }

	public toLink(label = this.name): string {
		if (this.url) {
			return `<a href="${this.url}">View ${label} on the web</a>`;
		}
		return "";
	}

	// #endregion IHasLink

	// #region IHasDetails

	public get description(): string { return this.core.description ?? ""; }
	public get details(): TDetail[] {
		return <string[]>this.core.details ?? (this.core.details = []);
		/* In case i end up with details as string and not array again ...
		// if (!Array.isArray(this.core.details)) {
		// 	this.core.details = typeof(this.core.details) === "string" ? [this.core.details] : [];
		// }
		// return this.core.details;
		*/
	}
	public get hasDescription(): boolean { return this.description.length > 0; }
	public get hasDetails(): boolean { return this.details.length > 0; }
	public get hasSuccessOrFailure(): boolean {
		return isSuccessFailureDetail(this.core) || this.details.find(isSuccessFailureDetail) !== undefined;
	}

	protected appendDescriptionTo(content: RenderableContent): void {
		if (!this.hasDescription) {
			return;
		}
		content.appendSection(`<i>${this.description}</i>`);
	}

	protected appendDetailsTo(content: RenderableContent): void {
		if (!this.hasDetails) {
			return;
		}
		let wasBlock = false;
		this.details.forEach((detail, detailIndex) => {
			if (typeof (detail) === "string") {
				content.append(tabNewLineOrEmpty(detailIndex, wasBlock) + detail);
				wasBlock = false;
			} else {
				if (this.appendSuccessFailureTo(content, detail)) {
					wasBlock = !detail.followUp?.length;
				} else {
					Object.keys(detail).forEach((key, keyIndex) => {
						content.append(tabNewLineOrEmpty(detailIndex + keyIndex, wasBlock) + detail[key]);
					});
					wasBlock = false;
				}
			}
		});

		//#region TODO: phase this out when data is fully updated.
		// this will process the old data style of separate core properties for success/failure
		this.appendSuccessFailureTo(content, this.core);
		//#endregion
	}

	/** Returns true if the given detail was a THasSuccessOrFailure and was appended. */
	private appendSuccessFailureTo(content: RenderableContent, detail: TDetail | THasSuccessOrFailure): detail is THasSuccessOrFailure {
		if (isSuccessFailureDetail(detail)) {
			if (detail.criticalSuccess?.length) {
				content.appendBlockquote(detail.criticalSuccess, "Critical Success");
			}
			if (detail.success?.length) {
				content.appendBlockquote(detail.success, "Success");
			}
			if (detail.failure?.length) {
				content.appendBlockquote(detail.failure, "Failure");
			}
			if (detail.criticalFailure?.length) {
				content.appendBlockquote(detail.criticalFailure, "Critical Failure");
			}
			if (detail.followUp?.length) {
				content.append(...RenderableContent.toParagraphs(detail.followUp));
			}
			return true;
		}
		return false;
	}
	// #endregion IHasDetails

	// #region IHasName

	private _nameMatcher?: StringMatcher;
	private get nameMatcher(): StringMatcher {
		return this._nameMatcher ?? (this._nameMatcher = StringMatcher.from(this.name));
	}

	public get name(): string { return this.core.name; }
	public get nameClean(): string { return this.nameMatcher.matchValue; }
	public get nameLower(): string { return this.nameMatcher.lower; }

	public matches(other: StringMatcher): boolean {
		return this.nameMatcher.matches(other);
	}

	// #endregion IHasName

	// #region Renderable
	public toRenderableContent(): UtilsRenderableContent {
		const renderable = new RenderableContent(this);
		renderable.setTitle(`<b>${this.name}</b> (${this.objectType})`);
		this.appendDescriptionTo(renderable);
		this.appendDetailsTo(renderable);
		return renderable;
	}
	// #endregion Renderable

	// #region Comparable

	public compareTo(other: Base<T, U>): SortResult {
		return sortPrimitive(this.objectType, other.objectType)
			|| sortPrimitive(this.nameClean, other.nameClean)
			|| sortPrimitive(this.nameLower, other.nameLower)
			|| sortPrimitive(this.name, other.name);
	}

	// #endregion Comparable

	// #region Searchable

	public get searchResultCategory(): string {
		return this.objectType as unknown as string;
	}

	public search(searchInfo: SearchInfo): SearchScore<this> {
		const score = searchInfo.score(this, this.name);
		if (searchInfo.globalFlag) {
			score.append(searchInfo.score(this, this.description));
			this.details.forEach(detail => {
				if (typeof (detail) === "string") {
					score.append(searchInfo.score(this, detail));
				} else {
					Object.keys(detail).forEach(key => score.append(searchInfo.score(this, detail[key])));
				}
			});
		}
		return score;
	}

	public searchRecursive(searchInfo: SearchInfo): SearchScore<this>[] {
		return [this.search(searchInfo)];
	}

	public toSearchResult(): string {
		return this.core.name;
	}

	// #endregion
}
