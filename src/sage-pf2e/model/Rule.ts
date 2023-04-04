import type { RenderableContent } from "../../sage-utils/RenderUtils";
import type { SearchInfo, SearchScore } from "../../sage-utils/SearchUtils";
import { Pf2eRenderableContent } from "../Pf2eRenderableContent";
import type { ActionCore } from "./Action";
import type { SourcedCore } from "./base/HasSource";
import { HasSource } from "./base/HasSource";

type TRuleChildArray = (RuleCore | ActionCore)[];

export interface RuleCore extends SourcedCore<"Rule"> {
	children?: TRuleChildArray;
}

function parseChildren(cores?: TRuleChildArray): Rule[] {
	const filtered = <RuleCore[]>(cores || []).filter((core, index, array) => {
		const version = core.version ?? 0;
		if (version < 0) {
			return false;
		}

		const next = array[index + 1];
		if (next && core.name === next.name) {
			const nextVersion = next.version ?? 0;
			if (version < nextVersion) {
				return false;
			}
		}

		return true;
	});
	//TODO: Rule or Action ? ?
	return filtered.map(Rule.from);
}

export class Rule extends HasSource<RuleCore> {
	private _children?: Rule[];
	public get children(): Rule[] {
		return this._children ?? (this._children = parseChildren(this.core.children));
	}

	private _hasChildren?: boolean;
	public get hasChildren(): boolean {
		return this._hasChildren ?? (this._hasChildren = this.children.length > 0);
	}

	// #region IRenderable
	public toRenderableContent(): RenderableContent {
		const renderable = new Pf2eRenderableContent(this);
		renderable.setTitle(`<b>${this.name}</b>`);
		this.appendDescriptionTo(renderable);
		this.appendDetailsTo(renderable);
		this.children.forEach(child => child.appendAsChild(renderable));
		return renderable;
	}
	private appendAsChild(renderable: Pf2eRenderableContent): void {
		if (this.hasDescription) {
			renderable.appendTitledSection(`<b>${this.name}</b>`, `<i>${this.description}</i>`);
			renderable.appendParagraphsSection(<string[]>this.details);
		} else if (this.hasDetails) {
			renderable.appendTitledSection(`<b>${this.name}</b>`, ...Pf2eRenderableContent.toParagraphs(<string[]>this.details));
		}
		this.children.forEach(child => child.appendAsChild(renderable));
	}
	// #endregion IRenderable

	// #region ISearchable
	public searchRecursive(searchInfo: SearchInfo): SearchScore<this>[] {
		const scores = [];
		scores.push(this.search(searchInfo));
		this.children.forEach(child => {
			scores.push(...child.searchRecursive(searchInfo));
		});
		return scores;
	}
	// #endregion ISearchable

	public static from(core: RuleCore): Rule { return new Rule(core); }
}
