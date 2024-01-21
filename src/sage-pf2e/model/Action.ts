import type { SortResult } from "@rsc-utils/array-utils";
import type { RenderableContent as UtilsRenderableContent } from "@rsc-utils/render-utils";
import type { SearchInfo, SearchScore } from "../../sage-utils/utils/SearchUtils";
import type { TAction, TSkill } from "../common";
import { NEWLINE, TAB } from "../common";
import { RenderableContent } from "../data/RenderableContent";
import type { SourcedCore } from "./base/HasSource";
import { HasSource } from "./base/HasSource";

export interface ActionCore<T extends string = "Action"> extends SourcedCore<T> {
	actionType?: TAction;
	category: string;
	effect: string[];
	frequency: string[];
	requirements: string[];
	skill?: TSkill;
	trained?: boolean;
	trigger: string[];
}

export class Action<T extends string = "Action", U extends ActionCore<T> = ActionCore<T>>  extends HasSource<U, T> {
	//#region Constructor

	public constructor(core: U) {
		super(core);
	}

	//#endregion

	//#region Properties

	public get actionType(): TAction { return this.core.actionType ?? <TAction>""; }
	public get category(): string { return this.core.skill ?? this.core.category ?? "Other"; }
	public get effect(): string[] { return this.core.effect ?? []; }
	public get frequency(): string[] { return this.core.frequency ?? []; }
	public get requirements(): string[] { return this.core.requirements ?? []; }
	public get skill(): TSkill | undefined { return this.core.skill; }
	public get trained(): boolean { return this.core.trained === true; }
	public get trigger(): string[] { return this.core.trigger ?? []; }

	//#endregion

	//#region Comparable<T>

	public compareTo(other: Action<T, U>): SortResult {
		const result = super.compareTo(other);
		if (result !== 0) {
			return result;
		}

		const thisSkill = this.core.skill,
			otherSkill = other.core.skill;
		if (thisSkill === otherSkill) {
			return 0;
		}

		if (!thisSkill) {
			return -1;
		}
		if (!otherSkill) {
			return 1;
		}

		return thisSkill < otherSkill ? -1 : 1;
	}

	//#endregion

	//#region IRenderable

	public toRenderableContent(): UtilsRenderableContent {
		const content = new RenderableContent(this);

		content.setTitle(`<b>${this.name}</b> ${this.actionType}`);

		content.append(this.traits.join(", "));

		if (this.requirements.length) {
			content.append(this.requirements.map((s, i) => (i ? TAB : "<b>Requirements</b> ") + s).join(NEWLINE));
		}

		this.appendDetailsTo(content);

		return content;
	}

	//#endregion

	//#region utils.SearchUtils.ISearchable

	public search(searchInfo: SearchInfo): SearchScore<this> {
		const score = super.search(searchInfo);
		if (searchInfo.globalFlag) {
			score.append(searchInfo.score(this, this.skill ?? "", this.trained ? "trained" : "", this.traits, this.frequency, this.trigger, this.requirements, this.effect));
		}
		return score;
	}

	//#endregion

}
