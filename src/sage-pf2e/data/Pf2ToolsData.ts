import type { IComparable, IRenderable, ISearchable, TSortResult, UUID } from "../../sage-utils";
import utils from "../../sage-utils";
import { Repository } from "..";
import { COMMON, RARITIES, TRarity } from "../common";
import type { IHasArchives, IHasDetails, IHasLink, IHasName } from "../model/base/interfaces";
import type Class from "../model/Class";
import RenderableContent from "./RenderableContent";
import { find } from "./Repository";

const PF2_TOOLS_URL = "https://character.pf2.tools/assets/json/all.json";
const allCores = new utils.ArrayUtils.Collection<Pf2ToolsDataCore>();

export type Pf2ToolsDataCore = {
	/** The id of Sage's version of this object. */
	id: UUID;
	name: string;
	level: number;
	pfs: "standard" | "limited";
	/** comma separated */
	traits: string;
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
};

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

export default class Pf2ToolsData
	implements
		IHasArchives,
		IComparable<Pf2ToolsData>,
		IHasDetails,
		IHasLink,
		IHasName,
		IRenderable,
		ISearchable {

	public constructor(protected core: Pf2ToolsDataCore) {
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
	public objectType = utils.StringUtils.capitalize(this.core.type);
	public toString(): string { return this.core.name; }

	//#region HasSource properies
	public hasPage = !!(this.core.source?.match(/pg\. \d+/));
	public pages = this.hasPage ? [this.core.source.match(/pg\. (\d+)/)![1]] : [];
	public source = findSource(this.core.source);
	public version = this.core.source?.match(/(\d+\.\d+)$/)?.[1] ?? "1.0";
	public sources = [{ pages:this.pages, source:this.source, version:this.version }];
	public hasErrata = false;
	public isErrata = false;
	//#endregion

	// #region IHasArchives

	public aonId = +(this.core.aon?.match(/\D+(\d+)(\:\d+)?$/)?.[1] ?? 0) || undefined;
	public aonTraitId = undefined;

	public toAonLink(label = this.name): string {
		return `<a href="${this.core.src}">View ${label} on Archives of Nethys</a>`;
	}

	// #endregion IHasArchives

	// #region IHasDetails

	public description = "";
	public details = this.core.body?.split("\n") ?? [];
	public hasDescription = false;
	public hasDetails = this.details.length > 0;
	public hasSuccessOrFailure = false;

	protected appendDescriptionTo(_: RenderableContent): void {
		// these don't have descriptions
	}

	protected appendDetailsTo(content: RenderableContent): void {
		this.details.forEach(detail => content.append(detail));
	}

	// #endregion IHasDetails

	// #region IHasLink

	public url = undefined;

	public toLink(_?: string): string { return ""; }

	// #endregion IHasLink

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

	//#region IHasTraits

	public traits = (this.core.traits ?? "").split(",").filter(s => s?.trim());
	public hasTraits = this.traits.length > 0;

	public nonRarityTraits = this.traits.filter(trait => !RARITIES.includes(trait as TRarity));
	public hasNonRarityTraits = this.nonRarityTraits.length > 0;

	public includesTrait(trait: string): boolean { return this.traits.includes(trait); }

	//#endregion

	//#region IHasRarity

	public rarity = RARITIES.find(rarity => this.traits.includes(rarity)) ?? COMMON;
	public isNotCommon = this.rarity !== COMMON;

	//#endregion

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

	//#region all cores

	public static async load(distPath: string): Promise<boolean> {
		allCores.empty();
		const path = `${distPath}/pf2-tools.json`;
		const pf2ToolsCores = await utils.FsUtils.readJsonFile<Pf2ToolsDataCore[]>(path).catch(() => null);
		if (pf2ToolsCores?.length) {
			allCores.push(...pf2ToolsCores);
			console.info(`\t\t${pf2ToolsCores.length} Total PF2 Tools Cores loaded`);
		}else {
			console.warn(`\t\tUnable to load PF2 Tools Cores: ${path}`);
		}
		return !allCores.isEmpty;
	}

	public static async fetch(): Promise<boolean> {
		allCores.empty();
		console.info(`Fetching new data from pf2 tools ...`);
		const cores = await utils.HttpsUtils.getJson<Pf2ToolsDataCore[]>(PF2_TOOLS_URL).catch(() => null);
		if (Array.isArray(cores)) {
			allCores.push(...cores);
		}
		return !allCores.isEmpty;
	}

	public static async save(distPath: string): Promise<boolean> {
		const path = `${distPath}/pf2-tools.json`;
		console.info(`Saving PF2 Tools Cores: ${path}`);
		return utils.FsUtils.writeFile(path, allCores, true, true);
	}

	public static async loadOrFetchAndSave(distPath: string): Promise<boolean> {
		const loaded = await this.load(distPath);
		if (!loaded) {
			const fetched = await this.fetch();
			if (fetched) {
				return this.save(distPath);
			}
			return fetched;
		}
		return loaded;
	}

	public static getAll(): utils.ArrayUtils.Collection<Pf2ToolsDataCore> {
		return allCores;
	}

	//#endregion

	//#region objectType conversion

	public static objectTypeToPf2Type(sageCore: TSageCore): string {
		if (sageCore.objectType === "ClassPath") {
			const clss = find<Class>("Class", klass => klass.name === sageCore.class);
			return clss?.classPath?.replace(/\s+/, "").toLowerCase()
				?? sageCore.objectType.toLowerCase();
		}
		return toPf2Type(sageCore.objectType);
	}

	//#endregion

	//#region name lookup

	public static checkForName(core: TSageCore): Pf2ToolsDataCore | undefined {
		if (["Rule"].includes(core.objectType)) {
			return undefined;
		}

		const pf2Type = Pf2ToolsData.objectTypeToPf2Type(core);
		const filtered = Pf2ToolsData.getAll().filter(o => o.type === pf2Type);
		return filtered.find(pf2 => nameGotFixed(pf2, core));

		function nameGotFixed(pf2: Pf2ToolsDataCore, sage: TSageCore) {
			return pf2?.name === "MONKEY TOWN" && sage?.name === "HOT STUFF";
			/*// if (sage.objectType === "Domain" && pf2.name === `${sage.name} Domain`) return sage.name = `${sage.name} Domain`;*/
		}
	}

	//#endregion

	//#region search

	public static search
			<T extends ISearchable = ISearchable, U extends SearchScore<T> = SearchScore<T>>
			(searchInfo: utils.SearchUtils.SearchInfo, objectTypes: string[]): U[] {
		const searchScores: U[] = [];
		const types = objectTypes.map(toPf2Type);
		allCores.forEach(core => {
			if (types.includes(core.type)) {
				const pf2tData = new Pf2ToolsData(core);
				const results = pf2tData.searchRecursive(searchInfo);
				const filtered = results.filter(result => result.bool);
				searchScores.push(...filtered as unknown as U[]);
			}
		});
		return searchScores;
	}

	//#endregion

	public static logKeyMap(): void {
		console.log(keyMap);
	}
}

function toPf2Type(value: string): string {
	value = value.toLowerCase();
	switch (value) {
		case "faith": return "deity";
		case "focusspell": return "focus";
		case "gear": return "item";
		default: return value;
	}
}

type SearchScore<T extends ISearchable> = utils.SearchUtils.SearchScore<T>;
