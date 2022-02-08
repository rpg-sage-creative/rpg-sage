import utils from "../../../sage-utils";
import RenderableContent from "../../data/RenderableContent";
import type { IFile } from "../../data/Repository";
import * as Repository from "../../data/Repository";
import Base, { BaseCore } from "./Base";

export interface SourceCore extends BaseCore<"Source"> {
	apName?: string;
	apNumber?: number;
	apVolume?: number;
	code: string;
	files: IFile[];
	productLine: string;
	iconUrl?: string;
	issue?: number;
}

let crb: Source;
export default class Source extends Base<SourceCore, "Source"> {
	// #region Instance Properties

	/** @deprecated */
	public get abbreviation(): string { return this.name.split(/\s+/).map(s => s[0]).join(""); }
	public get apName(): string | undefined { return this.core.apName; }
	public get apNumber(): number | undefined { return this.core.apNumber; }
	public get apVolume(): number | undefined { return this.core.apVolume; }
	public get code(): string { return this.core.code ?? ""; }
	public isAp = !!this.core.apName && !!this.core.apNumber && !!this.core.apVolume;
	public get isCore(): boolean { return this.core.code === Source.CoreCode; }
	public get productLine(): string { return this.core.productLine; }
	public get is3PP(): boolean { return !this.code.startsWith("PZO"); }
	public get url(): string | undefined { return this.core.url; }
	public get iconUrl(): string | undefined { return this.core.iconUrl; }
	public get issue(): number | undefined { return this.core.issue; }

	public toVerboseString(): string {
		if (this.isAp) {
			return `Pathfinder Adventure Path #${this.apNumber}: ${this.name} (${this.apName} ${this.apVolume} of 6)`;
		}
		if (this.is3PP) {
			if (this.issue) {
				return `${this.productLine} (Issue ${this.issue}): ${this.name}`;
			}
			return `${this.productLine} - ${this.name}`;
		}
		return this.name;
	}
	public toString(): string {
		if (this.isAp) {
			return `AP #${this.apNumber}: ${this.name}`;
		}
		return this.name;
	}
	// #endregion Instance Properties

	// #region IHasName

	private _codeMatcher?: utils.StringUtils.StringMatcher;
	public matches(other: utils.StringUtils.StringMatcher): boolean {
		const codeMatcher = this._codeMatcher ?? (this._codeMatcher = utils.StringUtils.StringMatcher.from(this.code));
		return codeMatcher.matches(other) || super.matches(other);
	}

	// #endregion IHasName

	// #region utils.RenderUtils.IRenderable
	public toRenderableContent(): utils.RenderUtils.RenderableContent {
		const renderable = new RenderableContent(this);
		renderable.setTitle(`<b>${this.name}</b> (${this.objectType})`);
		if (this.isAp || this.is3PP) {
			renderable.append(`<i>${this.toVerboseString()}</i>`);
		}
		this.appendDescriptionTo(renderable);
		this.appendDetailsTo(renderable);
		if (!this.is3PP) {
			renderable.appendSection(`<br><b>Paizo Code</b> ${this.code}`);
		}
		if (this.iconUrl) {
			renderable.setThumbnailUrl(this.iconUrl);
		}
		return renderable;
	}
	// #endregion utils.RenderUtils.IRenderable

	// #region utils.SearchUtils.ISearchable
	public search(searchInfo: utils.SearchUtils.SearchInfo): utils.SearchUtils.SearchScore<this> {
		const score = super.search(searchInfo);
		score.append(searchInfo.score(this, this.abbreviation));
		if (this.isAp) {
			score.append(searchInfo.score(this, this.toVerboseString()));
		}
		return score;
	}
	public get searchResultCategory(): string {
		return `Source (${this.productLine})`;
	}
	// #endregion utils.SearchUtils.ISearchable

	// #region Static Properties
	public static CoreCode = "PZO2101";
	public static get Core(): Source { return crb ?? (crb = Repository.findByValue("Source", Source.CoreCode)); }

	// #endregion Static Properties

}
