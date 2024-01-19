import { Check } from "./Check";
import type { PlayerCharacter } from "./PlayerCharacter";
import { STRENGTH } from "../../common";

export class Encumbrance {

	public constructor(private pc: PlayerCharacter) { }

	public get bulkLimit(): Check {
		const check = new Check(this.pc, "Bulk Limit");
		check.setAbility(STRENGTH);
		this.pc.features.getMetadata().forEach(hasMeta => {
			hasMeta.metadata.bulkLimits.forEach(bulkMeta => {
				check.addModifier(hasMeta.name, bulkMeta.limit!, bulkMeta.bonusType);
			});
		});
		return check;
	}
	// public get bulkLimitTooltip(): string {debug(this.bulkLimit);
	// 	let strMod = this.pc.abilities.strMod;
	// 	return `Bulk Limit: ${strMod + 10} = ${strMod} + 10`;
	// }
	public get bulkThreshold(): Check {
		const check = new Check(this.pc, "Bulk Threshold", 5);
		check.setAbility(STRENGTH);
		this.pc.features.getMetadata().forEach(hasMeta => {
			hasMeta.metadata.bulkThresholds.forEach(bulkMeta => {
				check.addModifier(hasMeta.name, bulkMeta.threshold!, bulkMeta.bonusType);
			});
		});
		return check;
	}
	// public get bulkThresholdTooltip(): string {
	// 	let strMod = this.pc.abilities.strMod;
	// 	return `Bulk Limit: ${strMod + 5} = ${strMod} + 5`;
	// }
	public get isEncumbered(): boolean {
		const bulkThreshold = this.bulkThreshold.dc;
		return this.pc.equipment.bulk.wholeBulk > bulkThreshold;
	}

	public toString(): string {
		return `Bulk: Encumbered ${this.bulkThreshold.dc}, Limit ${this.bulkLimit.dc}; Current ${this.pc.equipment.bulk}`;
	}
}
