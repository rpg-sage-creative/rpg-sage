import { Ability, type AbilityName } from "../../../gameSystems/d20/lib/Ability.js";
import type { TPathbuilderCharacterAbilityKey } from "../../../gameSystems/p20/import/pathbuilder-2e/types.js";
import { Abilities } from "../../../gameSystems/p20/lib/Abilities.js";
import { PathbuilderCharacter } from "./PathbuilderCharacter.js";

export class PbcAbilities extends Abilities {
	public constructor(private readonly pbc: PathbuilderCharacter) { super(); }

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
