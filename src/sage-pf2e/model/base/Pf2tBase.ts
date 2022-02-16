import { Repository } from "../..";
import type { IComparable, IRenderable, ISearchable, TSortResult } from "../../../sage-utils";
import utils from "../../../sage-utils";
import HasSource, { SourcedCore } from "./HasSource";
import type { IHasArchives, IHasDetails, IHasLink, IHasName } from "./interfaces";
import RenderableContent from "../../data/RenderableContent";
import { find } from "../../data/Repository";
import Source from "./Source";
import type { SourceCore } from "./Source";
import type { ClassCore } from "../Class";

type TClass = HasSource & { classPath:string; };

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

function toPf2Type(value: string): string {
	value = value.replace(/[\s']/g, "").toLowerCase();
	switch (value) {
		// "classpath" would need to get the name of the classpath, such as "racket"
		case "faith": return "deity";
		case "focusspell": return "focus";
		case "gear": return "item";
		case "dedicationfeat": return "feat";
		case "versatileheritage": return "ancestry";
		default: return value;
	}
}

//#region sources

const missingSources: string[] = [];

type TParsedSource = { name:string; source?:Source; page:number; version?:string; };
type TSourceOrCore = Source | SourceCore;

function matchSourceNames(a: string, b: string): boolean {
	return a === b
		|| a.replace(/-/g, " ") === b.replace(/-/g, " ")
		|| a.replace(/Shadows$/, "Shadow") === b.replace(/Shadows$/, "Shadow")
		|| a.replace(/Pathfinder Society Guide/, "PFS Guide") === b.replace(/Pathfinder Society Guide/, "PFS Guide");
}

function matchSourceByName(cores: TSourceOrCore[], name: string): TSourceOrCore | undefined {
	return cores.find(core => matchSourceNames(core.name, name));
}

function matchSourceByApName(cores: TSourceOrCore[], name: string): TSourceOrCore | undefined {
	return cores.find(core => matchSourceNames(`${core.apNumber} ${core.name}`, name));
}

function matchSourceByProductLineName(cores: TSourceOrCore[], name: string): TSourceOrCore | undefined {
	return cores.find(core => matchSourceNames(core.name, `${core.productLine}: ${name}`))
		?? cores.find(core => matchSourceNames(core.name, `${core.productLine}: The ${name}`));
}

function matchSource(sources: TSourceOrCore[], name: string): Source | undefined {
	const match = matchSourceByName(sources, name)
		?? matchSourceByProductLineName(sources, name)
		?? matchSourceByApName(sources, name);
	if (match) {
		return match instanceof Source ? match : new Source(match);
	}
	return undefined;
}

function parseSource(sources: TSourceOrCore[], value?: string): TParsedSource | null {
	// "source": "Core Rulebook pg. 283 2.0",
	const parts = value?.match(/^(.*?) pg. (\d+)(?: \d+\.\d+)?$/);
	if (!parts) {
		return null;
	}

	const name = parts[1];
	const page = +parts[2];
	const version = parts[3];

	const source = matchSource(sources, name);
	if (!source && !missingSources.includes(name)) {
		missingSources.push(name);
		console.log(`Unknown Source: ${name}`);
		return null;
	}

	return { source, name, page, version };
}

//#endregion

type TSageCore = { objectType:string; class?:string; name:string; traits?:string[]; };

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
	public get objectType(): string { return utils.StringUtils.capitalize(this.core.type); }
	public toString(): string { return this.core.name; }

	//#region HasSource properies
	private _parsedSource: TParsedSource | undefined | null;
	private get parsedSource(): TParsedSource | undefined {
		if (this._parsedSource === undefined) {
			this._parsedSource = Pf2tBase.parseSource(this.core.source);
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

	public toAonLink(label = this.name): string {
		return `<a href="${this.core.src}">View ${label} on Archives of Nethys</a>`;
	}

	// #endregion IHasArchives

	// #region IHasDetails

	public get description(): string { return ""; }
	public get details(): string[] { return this.core.body?.split("\n") ?? []; }
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
		renderable.append(`<i>Content from <https://character.pf2.tools></i>`);
		return renderable;
	}

	// #endregion utils.RenderUtils.IRenderable

	// #region utils.ArrayUtils.Sort.IComparable

	public compareTo(other: Pf2tBase): TSortResult {
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

	public static objectTypeToPf2Type(sageCore: TSageCore, cores?: ClassCore[]): string {
		if (sageCore.objectType === "ClassPath") {
			const clss = cores
				? cores.find(klass => klass.objectType === "Class" && klass.name === sageCore.class)
				: find<TClass>("Class", klass => klass.name === sageCore.class);
			if (clss?.classPath) {
				return toPf2Type(clss.classPath);
			}
		}
		if (["Spell","FocusSpell"].includes(sageCore.objectType) && sageCore.traits?.includes("Cantrip")) {
			return toPf2Type("Cantrip");
		}
		return toPf2Type(sageCore.objectType);
	}

	//#endregion

	public static parseSource(value: string, cores?: SourceCore[]): TParsedSource | null {
		return parseSource(cores ?? Repository.all<Source>("Source"), value);
	}

	public static logKeyMap(): void {
		console.log(keyMap);
	}
}
