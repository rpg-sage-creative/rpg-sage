import type { RenderableContent as UtilsRenderableContent } from "../../sage-utils/utils/RenderUtils";
import type { SearchInfo, SearchScore } from "../../sage-utils/utils/SearchUtils";
import RenderableContent from "../data/RenderableContent";
import type { ActionCore } from "./Action";
import type { SourcedCore } from "./base/HasSource";
import HasSource from "./base/HasSource";

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

export default class Rule extends HasSource<RuleCore> {
	private _children?: Rule[];
	public get children(): Rule[] {
		return this._children ?? (this._children = parseChildren(this.core.children));
	}

	private _hasChildren?: boolean;
	public get hasChildren(): boolean {
		return this._hasChildren ?? (this._hasChildren = this.children.length > 0);
	}

	// #region utils.RenderUtils.IRenderable
	public toRenderableContent(): UtilsRenderableContent {
		const renderable = new RenderableContent(this);
		renderable.setTitle(`<b>${this.name}</b>`);
		this.appendDescriptionTo(renderable);
		this.appendDetailsTo(renderable);
		this.children.forEach(child => child.appendAsChild(renderable));
		return renderable;
	}
	private appendAsChild(renderable: RenderableContent): void {
		if (this.hasDescription) {
			renderable.appendTitledSection(`<b>${this.name}</b>`, `<i>${this.description}</i>`);
			renderable.appendParagraphsSection(<string[]>this.details);
		} else if (this.hasDetails) {
			renderable.appendTitledSection(`<b>${this.name}</b>`, ...RenderableContent.toParagraphs(<string[]>this.details));
		}
		this.children.forEach(child => child.appendAsChild(renderable));
	}
	// #endregion utils.RenderUtils.IRenderable

	// #region utils.SearchUtils.ISearchable
	public searchRecursive(searchInfo: SearchInfo): SearchScore<this>[] {
		const scores = [];
		scores.push(this.search(searchInfo));
		this.children.forEach(child => {
			scores.push(...child.searchRecursive(searchInfo));
		});
		return scores;
	}
	// #endregion utils.SearchUtils.ISearchable

	public static from(core: RuleCore): Rule { return new Rule(core); }
}
