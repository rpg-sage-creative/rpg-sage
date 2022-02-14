import utils, { IComparable, IdCore, IRenderable, ISearchable, TSortResult } from "../../../sage-utils";
import { NEWLINE, TAB } from "../../common";
import type { Pf2ToolsDataCore } from "../../data/Pf2ToolsData";
import RenderableContent from "../../data/RenderableContent";
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

export interface BaseCore<T extends string = string> extends IdCore<T>, ArchivedCore, DetailedCore<T>, LinkedCore, NamedCore {
	pf2t?: Pf2ToolsDataCore;
	hash?: string;
}

type TChildCoreParser<T extends BaseCore> = (core: T) => T[];
export default class Base<T extends BaseCore<U> = BaseCore<any>, U extends string = string>
	extends
		utils.ClassUtils.HasIdCore<T, U>
	implements
		IHasArchives,
		IComparable<Base<T, U>>,
		IHasDetails,
		IHasLink,
		IHasName,
		IRenderable,
		ISearchable {

	// #region Constructor

	public constructor(protected core: T) {
		super(core);
		if (!core.id && !core.hash) {
			console.warn("NO ID!", core.name ?? core);
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
		return this.singular;
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

	public toAonLink(label = this.name): string {
		const objectType = (this.constructor as typeof Base).aon ?? (this.constructor as typeof Base).plural,
			aonId = this.aonId;
		if (objectType && aonId) {
			return `<a href="https://2e.aonprd.com/${objectType}.aspx?ID=${aonId}">View ${label} on Archives of Nethys</a>`;
		} else if (!this.url) {
			return `<a href="http://2e.aonprd.com/Search.aspx?query=${label.replace(/\s+/g, "+")}">Search ${label} on Archives of Nethys</a>`;
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

	private _nameMatcher?: utils.StringUtils.StringMatcher;
	private get nameMatcher(): utils.StringUtils.StringMatcher {
		return this._nameMatcher ?? (this._nameMatcher = utils.StringUtils.StringMatcher.from(this.name));
	}

	public get name(): string { return this.core.name; }
	public get nameClean(): string { return this.nameMatcher.clean; }
	public get nameLower(): string { return this.nameMatcher.lower; }

	public matches(other: utils.StringUtils.StringMatcher): boolean {
		return this.nameMatcher.matches(other);
	}

	// #endregion IHasName

	// #region utils.RenderUtils.IRenderable
	public toRenderableContent(): utils.RenderUtils.RenderableContent {
		const renderable = new RenderableContent(this);
		renderable.setTitle(`<b>${this.name}</b> (${this.objectType})`);
		this.appendDescriptionTo(renderable);
		this.appendDetailsTo(renderable);
		return renderable;
	}
	// #endregion utils.RenderUtils.IRenderable

	// #region utils.ArrayUtils.Sort.IComparable

	public compareTo(other: Base<T, U>): TSortResult {
		return utils.ArrayUtils.Sort.sortAscending(this.objectType, other.objectType)
			|| utils.ArrayUtils.Sort.sortAscending(this.nameClean, other.nameClean)
			|| utils.ArrayUtils.Sort.sortAscending(this.nameLower, other.nameLower)
			|| utils.ArrayUtils.Sort.sortAscending(this.name, other.name);
	}

	// #endregion utils.ArrayUtils.Sort.IComparable

	// #region utils.SearchUtils.ISearchable

	public get searchResultCategory(): string {
		return this.objectType as unknown as string;
	}

	public search(searchInfo: utils.SearchUtils.SearchInfo): utils.SearchUtils.SearchScore<this> {
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

	public searchRecursive(searchInfo: utils.SearchUtils.SearchInfo): utils.SearchUtils.SearchScore<this>[] {
		return [this.search(searchInfo)];
	}

	public toSearchResult(): string {
		return this.core.name;
	}

	// #endregion utils.SearchUtils.ISearchable
}
