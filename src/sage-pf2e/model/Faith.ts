import type utils from "../../sage-utils";
import type { TAlignment } from '../common';
import { ALIGNMENTS } from '../common';
import RenderableContent from '../data/RenderableContent';
import type { SourcedCore } from "./base/HasSource";
import HasSource from './base/HasSource';


export interface FaithCoreBase<T extends string = string> extends SourcedCore<T> {
	edicts: string[];
	anathema: string[];
	followerAlignments: TAlignment[];
}

export type FaithCore = FaithCoreBase<"Faith">;
/*// export interface FaithCore extends FaithCoreBase<"Faith"> { }*/

export default class Faith<T extends string = "Faith", U extends FaithCoreBase<T> = FaithCoreBase<T>> extends HasSource<U, T> {

	/**************************************************************************************************************************/
	// Properties

	public get edicts(): string[] { return this.core.edicts ?? []; }
	public get anathema(): string[] { return this.core.anathema ?? []; }

	private _followerAlignments?: TAlignment[];
	public get followerAlignments(): TAlignment[] {
		let followerAlignments = this._followerAlignments;
		if (!followerAlignments) {
			followerAlignments = this.core.followerAlignments ?? [];
			if (<string>followerAlignments[0] === "all") {
				followerAlignments = ALIGNMENTS.slice();
			}
			this._followerAlignments = followerAlignments;
		}
		return followerAlignments;
	}

	public toRenderableContent(): utils.RenderUtils.RenderableContent {
		const content = new RenderableContent(this);
		content.setTitle(`<b>${this.name}</b>`);
		this.appendDetailsTo(content);
		content.append(`<blockquote><b>Edicts</b> ${this.edicts.join(", ")}</blockquote>`);
		content.append(`<blockquote><b>Anathema</b> ${this.anathema.join(", ")}</blockquote>`);
		if (this.followerAlignments.length) {
			content.append(`<blockquote><b>Follower Alignments</b> ${this.followerAlignments.length === 9 ? "all" : this.followerAlignments.join(", ")}</blockquote>`);
		}
		return content;
	}

}
