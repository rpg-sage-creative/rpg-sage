import { sortPrimitive, type Comparable, type SortResult } from "@rsc-utils/array-utils";
import { capitalize } from "@rsc-utils/string-utils";
import type { ISearchable } from "../../../sage-utils";
import type { SearchInfo, SearchScore } from "../../../sage-utils/utils/SearchUtils";
import { TParsedSource, parseSources } from "../../data/Repository";
import type { Base } from "./Base";
import type { SourcedCore, TSourceInfo } from "./HasSource";
import { HasSource } from "./HasSource";
import type { Source } from "./Source";
import type { IHasArchives, IHasLink, IHasName } from "./interfaces";

/*
From https://elasticsearch.galdiuz.com/aon/_search
{
                    "id": 180,
                    "url": "Spells.aspx?ID=180",
                    "category": "spell",
                    "name": "Magic Missile",
                    "type": "Spell",
                    "pfs": "Standard",
                    "text": "Magic Missile Spell 1 Evocation Force Source Core Rulebook pg. 349 2.0 Traditions arcane , occult Bloodline imperial Deity Nethys Cast to ( somatic , verbal ) Range 120 feet; Targets 1 creature You send a dart of force streaking toward a creature that you can see. It automatically hits and deals 1d4+1 force damage. For each additional action you use when Casting the Spell, increase the number of missiles you shoot by one, to a maximum of three missiles for 3 actions. You choose the target for each missile individually. If you shoot more than one missile at the same target, combine the damage before applying bonuses or penalties to damage, resistances, weaknesses, and so forth. Heightened (+2) You shoot one additional missile with each action you spend.",
                    "source": "Core Rulebook",
                    "source_raw": "Core Rulebook pg. 349 2.0",
                    "level": 1,
                    "bloodline": [
                        "imperial"
                    ],
                    "cast": "Single Action to Three Actions",
                    "component": [
                        "somatic",
                        "verbal"
                    ],
                    "deity": "Nethys",
                    "heighten": [
                        "+2"
                    ],
                    "range": 120,
                    "range_raw": "120 feet",
                    "target": "1 creature",
                    "tradition": [
                        "arcane",
                        "occult"
                    ],
                    "trait": [
                        "Evocation",
                        "Force"
                    ],
                    "trait_raw": [
                        "Evocation",
                        "Force"
                    ]
                }
*/

export interface AonBaseCore extends SourcedCore<""> {
	category: string;
	level: number;
	/** Core Rulebook pg. 565 2.0 */
	source_raw: string | string[];
	/** raw text */
	text: string;
	type: string;
	/** aon target page (missing domain and slash): "Spells.aspx?ID=180" */
	url: string;
}

function hackCore(core: AonBaseCore): AonBaseCore {
	core.aonId = core.id as unknown as number;
	core.id = `${core.category}-${core.id}`;
	return core;
}

export class AonBase
	extends
		HasSource<AonBaseCore>
	implements
		IHasArchives,
		Comparable<AonBase>,
		IHasLink,
		IHasName,
		ISearchable {

	public constructor(protected core: AonBaseCore) {
		super(hackCore(core));
		this._objectType = capitalize(this.core.type);
	}

	public matchesBase(sageData: Base): boolean {
		return sageData.toAonLink().includes(this.core.url + '"');
	}

	private _objectType: string;
	public get objectType() { return this._objectType; }
	public get objectTypeLower() { return this.objectType.toLowerCase(); }
	public get rarityLower() { return this.rarity.toLowerCase(); }
	public toString(): string { return this.core.name; }

	//#region HasSource properies
	private _parsedSources: TParsedSource[] | undefined;
	private get parsedSources(): TParsedSource[] {
		if (!this._parsedSources) {
			this._parsedSources = parseSources(this.core.source_raw);
		}
		return this._parsedSources;
	}
	private get parsedSource(): TParsedSource | undefined {
		return this.parsedSources[0];
	}
	public get hasPage(): boolean { return !isNaN(this.parsedSource?.page ?? NaN); }
	public get pages(): string[] { return this.hasPage ? [String(this.parsedSource?.page)] : []; }
	public get source(): Source { return this.parsedSource?.source!; }
	public get version(): number { return this.parsedSource?.version ?? "1.0" as any; }
	public get sources(): TSourceInfo[] { return this.parsedSources.map(src => ({ pages:[String(src.page)], source:src.source!, version:this.version })); }
	public get hasErrata(): boolean { return false; }
	public get isErrata(): boolean { return false; }
	//#endregion

	// #region IHasArchives

	public get aonTraitId(): number | undefined { return undefined; }

	public toAonLink(): string;
	public toAonLink(label: string): string;
	public toAonLink(searchResult: true): string;
	public toAonLink(label?: boolean | string): string {
		if (label === true) {
			return `<a href="https://2e.aonprd.com/${this.core.url}">(link)</a>`;
		}
		return `<a href="https://2e.aonprd.com/${this.core.url}">View ${label} on Archives of Nethys</a>`;
	}

	// #endregion IHasArchives

	// #region IHasLink

	public get url(): string | undefined { return undefined; }

	public toLink(_?: string): string { return ""; }

	// #endregion IHasLink

	// #region Comparable

	public compareTo(other: AonBase): SortResult {
		const sortAscending = sortPrimitive;
		return sortAscending(this.objectType, other.objectType)
			|| sortAscending(this.nameClean, other.nameClean)
			|| sortAscending(this.nameLower, other.nameLower)
			|| sortAscending(this.name, other.name);
	}

	// #endregion Comparable

	// #region utils.SearchUtils.ISearchable

	public get searchResultCategory(): string {
		return this.core.level
			? `${this.objectType} ${this.core.level}`
			: this.objectType;
	}

	public search(searchInfo: SearchInfo): SearchScore<this> {
		return searchInfo.score(this, searchInfo.globalFlag ? this.core.text : this.name);
	}

	public searchRecursive(searchInfo: SearchInfo): SearchScore<this>[] {
		return [this.search(searchInfo)];
	}

	public toSearchResult(): string {
		return this.core.name;
	}

	// #endregion utils.SearchUtils.ISearchable

	public static searchRecursive(core: AonBaseCore, searchInfo: SearchInfo): SearchScore<AonBase>[] {
		return new AonBase(core).searchRecursive(searchInfo);
	}
}
