import { sortPrimitive, sortStringIgnoreCase } from "@rsc-utils/array-utils";
import { nth } from "@rsc-utils/number-utils";
import type { RenderableContent as UtilsRenderableContent } from "../../sage-utils/utils/RenderUtils";
import { rarityToSuper } from "../common";
import RenderableContent from "../data/RenderableContent";
import { all, find, findByValue } from "../data/Repository";
import HasSource, { SourcedCore } from "../model/base/HasSource";
import type DedicationFeat from "./DedicationFeat";
import type Feat from "./Feat";

export type TAdditionalFeat = string | { level: number; name: string; };
export interface ArchetypeCore extends SourcedCore<"Archetype"> {
	additionalFeats: TAdditionalFeat[];
}

function featNameToOutput(featName: string): string {
	const feat = findByValue("Feat", featName);
	if (!feat?.source) {
		return featName;
	}

	const featPage = feat.hasPage ? ` ${feat.pages[0]}` : ``;
	return `${feat.name} (<i>${feat.source.abbreviation}</i>${featPage})`;
}

function toRenderableContentByLevel(byLevel: string[][]): string[] {
	return byLevel.map((levelArray, level) => {
		if (!levelArray.length) {
			return "";
		}
		const levelString = level < 1 || level > 20 ? `` : `<b>${nth(level)}</b>`;
		const featStrings = levelArray.map(featNameToOutput);
		return `${levelString} ${featStrings.join(", ")}`.trim();
	}).filter(s => s);
}

function findFeats(archetype: Archetype): Feat[] {
	const allFeats = all<Feat>("Feat");

	const feats: Feat<any>[] = [];
	const dedication = archetype.dedication;
	if (dedication) {
		feats.push(dedication);
		feats.push(...findChildrenFeats(dedication.name));
	}
	feats.sort((a, b) => {
		return sortPrimitive(a.level, b.level)
			|| sortStringIgnoreCase(a.name, b.name);
	});
	return feats;

	function findChildrenFeats(featName: string): Feat[] {
		const children: Feat[] = [];
		const filtered = allFeats.filter(feat => feat.prerequisites.includes(featName));
		children.push(...filtered);
		filtered.forEach(feat => children.push(...findChildrenFeats(feat.name)));
		return children;
	}
}

export default class Archetype extends HasSource<ArchetypeCore> {

	private _dedication?: DedicationFeat;
	public get dedication(): DedicationFeat {
		if (!this._dedication) {
			this._dedication = find("DedicationFeat", dedication => dedication.archetype === this);
		}
		return this._dedication!;
	}

	//#region utils.RenderUtils.IRenderable

	public toRenderableContent(): UtilsRenderableContent {
		const renderable = new RenderableContent(this);
		renderable.setTitle(`<b>${this.name}</b> (${this.objectType})`);
		if (this.hasDescription) {
			renderable.appendSection(`<i>${this.description}</i>`);
		}
		this.appendDetailsTo(renderable);

		const additionalFeats = this.core.additionalFeats ?? [];
		if (additionalFeats.length) {
			const byLevel = additionalFeats.reduce((levelArray, featInfo) => {
				const isString = typeof (featInfo) === "string";
				const level = isString ? 21 : featInfo.level;
				(levelArray[level] ?? (levelArray[level] = [])).push(isString ? featInfo : featInfo.name);
				return levelArray;
			}, <string[][]>[]);

			const mapped = toRenderableContentByLevel(byLevel);
			renderable.append(`[spacer]<b>Additional Feats:</b> ${mapped.join("; ")}`);
		}

		const feats = findFeats(this);
		const featNames = feats.map(h => `${h.name}${rarityToSuper(h.rarity)} Feat ${h.level}`);
		renderable.appendTitledSection("Feats", `<ul><li>${featNames.join("</li><li>")}</li></ul>`);
		return renderable;
	}

	//#endregion

}
