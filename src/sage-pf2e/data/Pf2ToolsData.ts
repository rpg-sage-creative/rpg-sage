import { Repository } from "..";
import type { IComparable, IRenderable, ISearchable, TSortResult } from "../../sage-utils";
import utils from "../../sage-utils";
import HasSource, { SourcedCore } from "../model/base/HasSource";
import type { IHasArchives, IHasDetails, IHasLink, IHasName } from "../model/base/interfaces";
import type Class from "../model/Class";
import RenderableContent from "./RenderableContent";
import { find } from "./Repository";

export interface Pf2ToolsDataCore extends SourcedCore<""> {
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

type TSageCore = { objectType:string; class?:string; name:string; };

const keyMap = new Map();

function ensureName(value: string): string {
	return value;
}

function findSource(value: string) {
	const namePart = value.split("pg.")[0].trim();
	const name = ensureName(namePart);
	const source = Repository.findByValue("Source", name);
	if (!source) {
		console.log(`Missing Source: ${namePart}`);
	}
	return source;
}

function hackCore(core: Pf2ToolsDataCore): Pf2ToolsDataCore {
	core.traits = (core.traits as unknown as string ?? "").split(",").map(s => s?.trim()).filter(s => s);
	return core;
}

export default class Pf2ToolsData
	extends
		HasSource<Pf2ToolsDataCore>
	implements
		IHasArchives,
		IComparable<Pf2ToolsData>,
		IHasDetails,
		IHasLink,
		IHasName,
		IRenderable,
		ISearchable {

	public constructor(protected core: Pf2ToolsDataCore) {
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
	public get objectType(): string { return utils.StringUtils.capitalize(this.core.type); }
	public toString(): string { return this.core.name; }

	//#region HasSource properies
	public get hasPage() { return !!(this.core.source?.match(/pg\. \d+/)); }
	public get pages() { return this.hasPage ? [this.core.source.match(/pg\. (\d+)/)![1]] : []; }
	public get source() { return findSource(this.core.source); }
	public get version() { return this.core.source?.match(/(\d+\.\d+)$/)?.[1] ?? "1.0" as any; }
	public get sources() { return [{ pages:this.pages, source:this.source, version:this.version }]; }
	public get hasErrata() { return false; }
	public get isErrata() { return false; }
	//#endregion

	// #region IHasArchives

	public get aonId() { return +(this.core.aon?.match(/\D+(\d+)(\:\d+)?$/)?.[1] ?? 0) || undefined; }
	public get aonTraitId() { return undefined; }

	public toAonLink(label = this.name): string {
		return `<a href="${this.core.src}">View ${label} on Archives of Nethys</a>`;
	}

	// #endregion IHasArchives

	// #region IHasDetails

	public get description() { return ""; }
	public get details() { return this.core.body?.split("\n") ?? []; }
	public get hasDescription() { return false; }
	public get hasDetails() { return this.details.length > 0; }
	public get hasSuccessOrFailure() { return false; }

	protected appendDescriptionTo(_: RenderableContent): void {
		// these don't have descriptions
	}

	protected appendDetailsTo(content: RenderableContent): void {
		this.details.forEach(detail => content.append(detail));
	}

	// #endregion IHasDetails

	// #region IHasLink

	public get url() { return undefined; }

	public toLink(_?: string): string { return ""; }

	// #endregion IHasLink

	// #region IRenderable

	public toRenderableContent(): utils.RenderUtils.RenderableContent {
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

	public compareTo(other: Pf2ToolsData): TSortResult {
		const sortAscending = utils.ArrayUtils.Sort.sortAscending;
		return sortAscending(this.objectType, other.objectType)
			|| sortAscending(this.nameClean, other.nameClean)
			|| sortAscending(this.nameLower, other.nameLower)
			|| sortAscending(this.name, other.name);
	}

	// #endregion utils.ArrayUtils.Sort.IComparable

	// #region utils.SearchUtils.ISearchable

	public get searchResultCategory(): string {
		return this.objectType as unknown as string;
	}

	public search(searchInfo: utils.SearchUtils.SearchInfo): utils.SearchUtils.SearchScore<this> {
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

	public searchRecursive(searchInfo: utils.SearchUtils.SearchInfo): utils.SearchUtils.SearchScore<this>[] {
		return [this.search(searchInfo)];
	}

	public toSearchResult(): string {
		return this.core.name;
	}

	// #endregion utils.SearchUtils.ISearchable

	//#region objectType conversion

	public static objectTypeToPf2Type(sageCore: TSageCore): string {
		if (sageCore.objectType === "ClassPath") {
			const clss = find<Class>("Class", klass => klass.name === sageCore.class);
			if (clss?.classPath) {
				return toPf2Type(clss.classPath);
			}
		}
		return toPf2Type(sageCore.objectType);
	}

	//#endregion

	public static logKeyMap(): void {
		console.log(keyMap);
	}
}

function toPf2Type(value: string): string {
	value = value.replace(/[\s']/g, "").toLowerCase();
	switch (value) {
		// "classpath" would need to get the name of the classpath, such as "racket"
		case "faith": return "deity";
		case "focusspell": return "focus";
		case "gear": return "item";
		default: return value;
	}
}
