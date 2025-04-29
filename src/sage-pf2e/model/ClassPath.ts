import type { RenderableContent as UtilsRenderableContent } from "@rsc-utils/core-utils";
import { RenderableContent } from "../data/RenderableContent.js";
import { findByValue } from "../data/Repository.js";
import { HasSource, type SourcedCore } from "./base/HasSource.js";

export interface ClassPathCore extends SourcedCore<"ClassPath"> {
	class: string;
}

export class ClassPath extends HasSource<ClassPathCore> {

	public constructor(core: ClassPathCore) {
		super(core);
	}

	public class = findByValue("Class", this.core.class)!;

	//#region Instance Methods

	public toRenderableContent(): UtilsRenderableContent {
		const renderable = new RenderableContent(this);
		renderable.setTitle(`<b>${this.name}</b> (${this.class.classPath})`);
		if (this.hasTraits || this.isNotCommon) {
			const traits: string[] = [];
			if (this.isNotCommon) {
				traits.push(this.rarity);
			}
			traits.push(...this.nonRarityTraits);
			renderable.append(traits.map(trait => `[${trait}]`).join(" "));
		}
		this.appendDescriptionTo(renderable);
		this.appendDetailsTo(renderable);
		renderable.addAonLink(this.class.toAonLink());
		return renderable;
	}

	//#endregion

	//#region Searchable

	public get searchResultCategory(): string {
		return this.class.classPath;
	}

	//#endregion

}
