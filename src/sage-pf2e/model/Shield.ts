import type utils from "../../sage-utils";
import { MDASH, NEWLINE, TAB, toModifier } from "../common";
import RenderableContent from "../data/RenderableContent";
import type { BulkCore } from "./HasBulk";
import HasBulk from "./HasBulk";

/**************************************************************************************************************************/
// Interface and Class

export interface ShieldCore extends BulkCore<"Shield"> {
	acBonus: number;
	breakThreshold: number;
	coverAcBonus: number;
	hardness: number;
	hitPoints: number;
	level: number;
	price?: string;
	speedPenalty?: number;
}

export default class Shield extends HasBulk<ShieldCore, Shield> {

	public get acBonus(): number { return this.core.acBonus ?? 0; }
	public get breakThreshold(): number { return this.core.breakThreshold ?? (this.hitPoints / 2); }
	public get coverAcBonus(): number { return this.core.coverAcBonus ?? this.acBonus; }
	public get hardness(): number { return this.core.hardness ?? 0; }
	public get hitPoints(): number { return this.core.hitPoints ?? 0; }
	public isEquippable = true;
	public get level(): number { return this.core.level ?? 0; }
	public get price(): string | undefined { return this.core.price; }
	public get speedPenalty(): number | undefined { return this.core.speedPenalty; }

	public toRenderableContent(): utils.RenderUtils.RenderableContent {
		const content = new RenderableContent(this);

		const level = this.level ? `(level ${this.level})` : ``;
		const title = `<b>${this.name}</b> ${level}`;
		content.setTitle(title);

		content.append(`<b>Price</b> ${this.price ?? MDASH}`);

		const hasCoverBonus = this.coverAcBonus !== this.acBonus;
		const coverAcBonus = hasCoverBonus ? `, ${toModifier(this.coverAcBonus)} (Take Cover)` : ``;
		content.append(`<b>AC Bonus</b> ${toModifier(this.acBonus)} (raised)${coverAcBonus}`);

		content.append(`<b>Speed Penalty</b> ${this.speedPenalty ? toModifier(this.speedPenalty) + " ft." : MDASH}`);
		content.append(this.toRenderableBulkString());
		content.append(`<b>Hardness</b> ${this.hardness}`);
		content.append(`<b>Hit Points (HP)</b> ${this.hitPoints}; <b>Break Threshold (BT)</b> ${this.breakThreshold}`);

		content.append(...this.details.map((d, i) => (i ? TAB : NEWLINE) + d));

		content.appendTitledSection(`<b>AC Bonus (raised)</b>`, `Gaining a shield's circumstance bonus to AC requires using the Raise a Shield action (found on page 472).`);
		if (hasCoverBonus) {
			content.appendTitledSection(`<b>AC Bonus (Take Cover)</b>`, `Getting the higher bonus for a tower shield requires using the Take Cover action (page 471) while the shield is raised.`);
		}

		return content;
	}

}
