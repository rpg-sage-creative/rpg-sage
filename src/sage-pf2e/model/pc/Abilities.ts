import { Ability, type AbilityName } from "../../../gameSystems/d20/lib/Ability.js";
import { AbilitiesP20 } from "../../../gameSystems/p20/lib/Abilities.js";
import type { TPathbuilderCharacterAbilityKey } from "./PathbuilderCharacter.js";
import { PathbuilderCharacter } from "./PathbuilderCharacter.js";
import type { PlayerCharacter } from "./PlayerCharacter.js";

export class PcAbilities extends AbilitiesP20 {
	public constructor(private pc: PlayerCharacter) { super(); }

	public getAbilityScore(ability: AbilityName): number {
		let score = 10;
		this.pc.features.forEach(feature => feature.hasMetadata, feature => {
			score += feature.metadata.getAbilityDelta(ability) * 2;
		});
		if (score > 18) {
			score = 18 + (score - 18) / 2;
		}
		this.pc.equipment.forEach(eq => eq.meta.potentAbilities !== undefined, eq => {
			if (eq.meta.potentAbilities.includes(ability)) {
				if (score < 18) {
					score = 18;
				}else {
					score += 2;
				}
			}
		});
		return score;
	}

	public getKeyAbility(klass: string | undefined = this.pc.class?.name): AbilityName | undefined {
		if (klass) {
			const feature = this.pc.features.find(f => f.hasMetadata && f.metadata.getKeyAbility(klass) !== undefined);
			return feature?.metadata.getKeyAbility(klass);
		}
		return undefined;
	}

	public getKeyAbilityScoreModifier(klass: string | undefined = this.pc.class?.name): number {
		return super.getKeyAbilityScoreModifier(klass);
	}
}

export class PbcAbilities extends AbilitiesP20 {
	public constructor(private pbc: PathbuilderCharacter) { super(); }

	public getAbilityScore(ability: AbilityName): number {
		const abilities = this.pbc.toJSON().abilities;
		const key = <TPathbuilderCharacterAbilityKey>ability.slice(0, 3).toLowerCase();
		return abilities[key];
	}

	public getKeyAbility(klass: string = this.pbc.toJSON().class): AbilityName | undefined {
		const key = klass === this.pbc.toJSON().class ? this.pbc.toJSON().keyability : undefined;
		return Ability.findByName(key)?.name;
	}

	public getKeyAbilityScoreModifier(klass: string = this.pbc.toJSON().class): number {
		return super.getKeyAbilityScoreModifier(klass);
	}
}
