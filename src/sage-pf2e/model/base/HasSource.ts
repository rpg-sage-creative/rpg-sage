import type { OrNull, OrUndefined } from "../../../sage-utils";
import utils, { UUID } from "../../../sage-utils";
import type { TRarity } from "../../common";
import { COMMON, RARITIES } from "../../common";
import RenderableContent from "../../data/RenderableContent";
import * as Repository from "../../data/Repository";
import Base, { BaseCore } from "./Base";
import type { IHasRarity, IHasTraits, RarityCore, TraitsCore } from "./interfaces";
import type Source from "./Source";

export type TSourceInfoRaw = {
	page?: number;
	pages?: (number | string)[];
	source: string;
	version?: number;
	previousId?: string;
};

export type TSourceInfo = {
	pages: string[];
	source: Source;
	version: number;
	previousId?: string;
};

export interface SourcedCore<T extends string = string> extends BaseCore<T>, TraitsCore, RarityCore {
	page?: number;
	pages?: string[];
	/** Paizo code: PZO2101 */
	source: string;
	sources?: TSourceInfoRaw[];
	version?: number;
	previousId?: string;
}

function doPages(sourceInfo: TSourceInfoRaw): string[] {
	if (sourceInfo.pages) {
		return sourceInfo.pages.map(pageInfo => String(pageInfo));
	}
	return sourceInfo.page ? [String(sourceInfo.page)] : [];
}
function parseSourceInfo(sourceInfo: TSourceInfoRaw): TSourceInfo {
	const pages = doPages(sourceInfo);
	const source = Repository.findByValue("Source", sourceInfo.source)!;
	const version = sourceInfo.version || 0;
	return { pages: pages, source: source, version: version };
}



export default abstract class HasSource<T extends SourcedCore<U> = SourcedCore<any>, U extends string = string>
	extends
		Base<T, U>
	implements
		IHasTraits,
		IHasRarity {
	// #region Instance Properties

	public get hasPage(): boolean {
		return this.pages.length > 0;
	}

	public get pages(): string[] {
		if (this.core.page) {
			return [String(this.core.page)];
		}
		return this.core.pages ?? [];
	}

	private _source?: Source;
	public get source(): Source {
		if (this._source === undefined) {
			this._source = Repository.findByValue("Source", this.core.source)!;
		}
		return this._source;
	}

	private _sources?: TSourceInfo[];
	public get sources(): TSourceInfo[] {
		if (!this._sources) {
			this._sources = (this.core.sources ?? []).map(parseSourceInfo);
			if (!this._sources.length) {
				this._sources.push(parseSourceInfo(this.core));
			}
		}
		return this._sources;
	}
	public get version(): number { return this.core.version ?? 0; }

	public get hasErrata(): boolean { return this.nextId !== undefined; }
	public get isErrata(): boolean { return this.version !== 0; }

	public get previousId(): OrUndefined<UUID> { return this.core.previousId; }

	private _previousIdMatcher?: utils.UuidUtils.UuidMatcher;
	protected get previousIdMatcher(): utils.UuidUtils.UuidMatcher {
		return this._previousIdMatcher ?? (this._previousIdMatcher = utils.UuidUtils.UuidMatcher.from(this.core.previousId!));
	}

	/** Store null if we look but can't find one. */
	private _nextId?: OrNull<UUID>;
	/** Only return a UUID or undefined */
	public get nextId(): OrUndefined<UUID> {
		if (this._nextId === undefined) {
			this._nextId = Repository.find<HasSource>(this.objectType, other =>
				other.isErrata && this.idMatcher.matches(other.previousIdMatcher)
			)?.id ?? null;
		}
		return this._nextId ?? undefined;
	}
	// #endregion Instance Properties

	// #region IHasArchives

	public toAonLink(label?: boolean | string): string {
		return this.source?.is3PP ? "" : super.toAonLink(label as string);
	}

	// #endregion IHasArchives

	//#region IHasTraits

	public get traits() { return this.core.traits ?? (this.core.traits = []); }
	public get hasTraits() { return this.traits.length > 0; }

	public get nonRarityTraits() { return this.traits.filter(trait => !RARITIES.includes(<TRarity>trait)); }
	public get hasNonRarityTraits() { return this.nonRarityTraits.length > 0; }

	public includesTrait(trait: string): boolean { return this.traits.includes(trait); }

	//#endregion

	//#region IHasRarity

	public get rarity() { return RARITIES.find(rarity => rarity === this.core.rarity) ?? RARITIES.find(rarity => this.traits.includes(rarity)) ?? COMMON; }
	public get isNotCommon() { return this.rarity !== COMMON; }

	//#endregion

	// #region utils.RenderUtils.IRenderable

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
}
