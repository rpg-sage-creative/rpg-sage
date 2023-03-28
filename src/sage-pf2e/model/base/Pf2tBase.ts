import type { IComparable, IRenderable, ISearchable, TSortResult } from "../../../sage-utils";
import { sortAscending } from "../../../sage-utils/utils/ArrayUtils/Sort";
import type { RenderableContent as _RenderableContent } from "../../../sage-utils/utils/RenderUtils";
import type { SearchInfo, SearchScore } from "../../../sage-utils/utils/SearchUtils";
import { capitalize } from "../../../sage-utils/utils/StringUtils";
import RenderableContent from "../../data/RenderableContent";
import { parseSource, TParsedSource } from "../../data/Repository";
import HasSource, { SourcedCore } from "./HasSource";
import type { IHasArchives, IHasDetails, IHasLink, IHasName } from "./interfaces";
import type Source from "./Source";

export interface Pf2tBaseCore extends SourcedCore<""> {
	/** The id(s) of Sage's version(s) of this object. */
	name: string;
	level: number;
	pfs: "standard" | "limited";
	/** comma separated */
	traits: string[];
	priceunit: "gp" | "sp" | "cp";
	price: number;
	/** 1 or "L" or "L (or -)" or "varies by armor" */
	bulk: string | number;
	usage?: string;
	/** Core Rulebook pg. 565 2.0 */
	source: string;
	/** aon url */
	src: string;
	/** typeID:level "equipment640:1" */
	aon: string;
	/** "item" | "spell" | etc */
	type: string;
	/** full contents, markdown */
	body: string;
	hash: string;

	actions?: number | string;
	/** class, ancestry, skill (Feat?) */
	subtype?: string;
	/** "arcane,divine,occult,primal" */
	traditions?: string;
	cast?: string;
	range?: string;
	archetype?: string;
	savingthrow?: string;
	group?: string;
	category?: string;
	acbonus?: number;
	basic?: string;
	damagedie?: string;
	damagetype?: string;
	hands?: number;
	max?: number;
	reload?: string;
	strength?: string;
	dexcap?: string;
	checkpenalty?: string;
	speedpenalty?: string;
}

const keyMap = new Map();

function hackCore(core: Pf2tBaseCore): Pf2tBaseCore {
	core.traits = (core.traits as unknown as string ?? "").split(",").map(s => s?.trim()).filter(s => s);
	return core;
}

export default class Pf2tBase
	extends
		HasSource<Pf2tBaseCore>
	implements
		IHasArchives,
		IComparable<Pf2tBase>,
		IHasDetails,
		IHasLink,
		IHasName,
		IRenderable,
		ISearchable {

	public constructor(protected core: Pf2tBaseCore) {
		super(hackCore(core));
		const keys = Object.keys(core);
		const newKeys = keys.filter(key => !keys.includes(key));
		if (newKeys.length) {
			console.log(`New PF2 Tools Keys: ${newKeys}`);
		}
		keys.forEach(key => {
			let list = keyMap.get(key);
			if (!list) {
				list = [];
				keyMap.set(key, list);
			}
			list.push(core.type);
		});
	}

	public get id(): string { return this.core.hash; }
	public get objectType(): string { return capitalize(this.core.type); }
	public toString(): string { return this.core.name; }

	//#region HasSource properies
	private _parsedSource: TParsedSource | undefined | null;
	private get parsedSource(): TParsedSource | undefined {
		if (this._parsedSource === undefined) {
			this._parsedSource = parseSource(this.core.source);
		}
		return this._parsedSource ?? undefined;
	}
	public get hasPage(): boolean { return !isNaN(this.parsedSource?.page ?? NaN); }
	public get pages(): string[] { return this.hasPage ? [String(this.parsedSource!.page)] : []; }
	public get source(): Source { return this.parsedSource?.source!; }
	public get version(): number { return this.parsedSource?.version ?? "1.0" as any; }
	public get sources() { return [{ pages:this.pages, source:this.source, version:this.version }]; }
	public get hasErrata(): boolean { return false; }
	public get isErrata(): boolean { return false; }
	//#endregion

	// #region IHasArchives

	public get aonId(): number | undefined { return +(this.core.aon?.match(/\D+(\d+)(\:\d+)?$/)?.[1] ?? 0) || undefined; }
	public get aonTraitId(): number | undefined { return undefined; }

	public toAonLink(label: boolean | string = this.name): string {
		return `<a href="${this.core.src}">View ${label} on Archives of Nethys</a>`;
	}

	// #endregion IHasArchives

	// #region IHasDetails

	public get description(): string { return ""; }
	private pf2tDetails: string[] | undefined;
	public get details(): string[] {
		if (!this.pf2tDetails) {
			this.pf2tDetails = (this.core.body?.split(/\r?\n\r?/) ?? [])
				.map(line => line.match(/^[\s\-]+$/) ? "" : line.trim())
				.filter((line, index, array) => line || (index && array[index - 1]));
		}
		return this.pf2tDetails;
	}
	public get hasDescription(): boolean { return false; }
	public get hasDetails(): boolean { return this.details.length > 0; }
	public get hasSuccessOrFailure(): boolean { return false; }

	protected appendDescriptionTo(_: RenderableContent): void {
		// these don't have descriptions
	}

	protected appendDetailsTo(content: RenderableContent): void {
		this.details.forEach(detail => content.append(detail));
	}

	// #endregion IHasDetails

	// #region IHasLink

	public get url(): string | undefined { return undefined; }

	public toLink(_?: string): string { return ""; }

	// #endregion IHasLink

	// #region IRenderable

	public toRenderableContent(): _RenderableContent {
		const renderable = new RenderableContent(this);
		renderable.setTitle(`<b>${this.name}</b> (${this.objectType})`);
		if (this.hasTraits || this.isNotCommon) {
			const traits: string[] = [];
			if (this.isNotCommon) {
				traits.push(this.rarity);
			}
			traits.push(...this.nonRarityTraits);
			renderable.append(traits.map(trait => `[${trait}]`).join(" "));
		}
		if (this.hasDescription) {
			renderable.appendSection(`<i>${this.description}</i>`);
		}
		this.appendDetailsTo(renderable);
		return renderable;
	}

	// #endregion utils.RenderUtils.IRenderable

	// #region utils.ArrayUtils.Sort.IComparable

	public compareTo(other: Pf2tBase): TSortResult {
		return sortAscending(this.objectType, other.objectType)
			|| sortAscending(this.nameClean, other.nameClean)
			|| sortAscending(this.nameLower, other.nameLower)
			|| sortAscending(this.name, other.name);
	}

	// #endregion utils.ArrayUtils.Sort.IComparable

	// #region ISearchable

	public get searchResultCategory(): string {
		return this.objectType as unknown as string;
	}

	public search(searchInfo: SearchInfo): SearchScore<this> {
		const score = searchInfo.score(this, this.name);
		if (searchInfo.globalFlag) {
			score.append(searchInfo.score(this, this.rarity, this.traits, this.description));
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

	// #endregion ISearchable

	public static logKeyMap(): void {
		console.log(keyMap);
	}
}
