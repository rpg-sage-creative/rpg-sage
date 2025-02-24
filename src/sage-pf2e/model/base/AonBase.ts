import { sortPrimitive, type Comparable, type SortResult } from "@rsc-utils/array-utils";
import { error } from "@rsc-utils/core-utils";
import type { SearchInfo, SearchScore, Searchable } from "@rsc-utils/search-utils";
import { capitalize } from "@rsc-utils/string-utils";
import { parseSources, type TParsedSource } from "../../data/Repository.js";
import type { Base } from "./Base.js";
import type { SourcedCore, TSourceInfo } from "./HasSource.js";
import { HasSource } from "./HasSource.js";
import type { Source } from "./Source.js";
import type { IHasArchives, IHasLink, IHasName } from "./interfaces.js";

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
	/** ["spell-123"] */
	legacy_id: string[];
	level: number;
	/** ["spell-123"] */
	remaster_id: string[];
	/** Core Rulebook pg. 565 2.0 */
	source_raw: string | string[];
	/** ["Cantrip", "Spell"] */
	spell_type: string;
	/** raw text */
	text: string;
	type: string;
	/** aon target page (missing domain and slash): "/Spells.aspx?ID=180" */
	url: string;
}

function hackCore(core: AonBaseCore): AonBaseCore {
	switch(typeof(core.id)) {
		case "number":
			core.aonId = core.id as unknown as number;
			core.id = `${core.category}-${core.id}`;
			break;
		case "string":
			core.aonId = +core.id.split("-")[0];
			break;
		default:
			error("unexpected core.id", core);
	}
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
		Searchable {

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

	// public get hasRemasterId(): boolean { return this.remasterId !== undefined; }
	public get remasterId(): string | undefined {
		const ids = this.core.remaster_id ?? [];
		const thisId = this.core.id;
		return ids.find(id => id !== thisId);
	}

	// public get hasLegacyId(): boolean { return this.legacyId !== undefined; }
	public get legacyId(): string | undefined {
		const ids = this.core.legacy_id ?? [];
		const thisId = this.core.id;
		return ids.find(id => id !== thisId);
	}

	public toAonLink(): string;
	public toAonLink(label: string): string;
	public toAonLink(searchResult: true): string;
	public toAonLink(label?: boolean | string): string {
		const createLink = (url: string, label: string) => `<a href="https://2e.aonprd.com/${url}">${label}</a>`;
		const thisUrl = this.core.url;

		if (label === true) {
			const { legacyId, remasterId } = this;
			if (remasterId) {
				const remasterUrl = thisUrl.replace(/\d+/, remasterId.split("-").pop()!);
				return `${createLink(remasterUrl, "(link)")} ${createLink(`${thisUrl}&NoRedirect=1`, "(legacy)")}`;
			}
			if (legacyId) {
				const legacyUrl = thisUrl.replace(/\d+/, legacyId.split("-").pop()!);
				return `${createLink(thisUrl, "(link)")} ${createLink(`${legacyUrl}&NoRedirect=1`, "(legacy)")}`;
			}
			return createLink(thisUrl, `(link)`);
		}
		return createLink(thisUrl, `View ${label} on Archives of Nethys`);
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

	// #region Searchable

	public get searchResultCategory(): string {
		if (this.core.spell_type === "Cantrip") {
			return "Cantrip";
		}
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

	// #endregion

	public static searchRecursive(core: AonBaseCore, searchInfo: SearchInfo): SearchScore<AonBase>[] {
		return new AonBase(core).searchRecursive(searchInfo);
	}
}
