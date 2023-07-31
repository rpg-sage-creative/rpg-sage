import type { TAbility } from "../../common";
import { ABILITIES, STRENGTH, DEXTERITY, CONSTITUTION, INTELLIGENCE, WISDOM, CHARISMA } from "../../common";
import type PlayerCharacter from "./PlayerCharacter";
import PathbuilderCharacter from "./PathbuilderCharacter";
import type { TPathbuilderCharacterAbilityKey } from "./PathbuilderCharacter";
import MythWeaversCharacter from "./MythWeaversCharacter";
import type { TMythWeaversCharacterAbilityKey } from "./MythWeaversCharacter";

export interface IHasAbilities { abilities: Abilities; }

export default abstract class Abilities {

	//#region Properties

	public get str(): number { return this.getAbilityScore(STRENGTH); }
	public get strMod(): number { return this.getAbilityScoreModifier(STRENGTH); }

	public get dex(): number { return this.getAbilityScore(DEXTERITY); }
	public get dexMod(): number { return this.getAbilityScoreModifier(DEXTERITY); }

	public get con(): number { return this.getAbilityScore(CONSTITUTION); }
	public get conMod(): number { return this.getAbilityScoreModifier(CONSTITUTION); }

	public get int(): number { return this.getAbilityScore(INTELLIGENCE); }
	public get intMod(): number { return this.getAbilityScoreModifier(INTELLIGENCE); }

	public get wis(): number { return this.getAbilityScore(WISDOM); }
	public get wisMod(): number { return this.getAbilityScoreModifier(WISDOM); }

	public get cha(): number { return this.getAbilityScore(CHARISMA); }
	public get chaMod(): number { return this.getAbilityScoreModifier(CHARISMA); }

	public get keyAbility(): TAbility | undefined { return this.getKeyAbility(); }

	//#endregion

	//#region Instance Methods

	/** Gets the Ability Score for the given Ability. */
	public abstract getAbilityScore(ability: TAbility): number;

	/** Gets the Ability Score Modifier for the given Ability. */
	public getAbilityScoreModifier(ability: TAbility): number {
		return ability ? Abilities.scoreToMod(this.getAbilityScore(ability)) : 0;
	}

	/** Gets the Key Ability for the given Class. */
	public abstract getKeyAbility(klass?: string): TAbility | undefined;

	/** Get the Ability Score Modifier for the given Class. */
	public getKeyAbilityScoreModifier(klass?: string): number {
		return this.getAbilityScoreModifier(this.getKeyAbility(klass)!);
	}

	//#endregion

	//#region Static Methods

	/** Converts an Ability Score to an Ability Score Modifier. */
	public static scoreToMod(score: number): number {
		return Math.floor((score - 10) / 2);
	}

	public static for(pc: PlayerCharacter | PathbuilderCharacter | MythWeaversCharacter): Abilities {
		if (PathbuilderCharacter.instanceOf<PathbuilderCharacter>(pc)) {
			return new PbcAbilities(pc);
		}
		if (MythWeaversCharacter.instanceOf<MythWeaversCharacter>(pc)) {
			return new MwcAbilities(pc);
		}
		return new PcAbilities(pc);
	}

	//#endregion
}

class PcAbilities extends Abilities {
	public constructor(private pc: PlayerCharacter) { super(); }

	public getAbilityScore(ability: TAbility): number {
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
	public getKeyAbility(klass: string | undefined = this.pc.class?.name): TAbility | undefined {
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

class PbcAbilities extends Abilities {
	public constructor(private pbc: PathbuilderCharacter) { super(); }

	public getAbilityScore(ability: TAbility): number {
		const abilities = this.pbc.toJSON().abilities;
		const key = <TPathbuilderCharacterAbilityKey>ability.slice(0, 3).toLowerCase();
		return abilities[key];
	}
	public getKeyAbility(klass: string = this.pbc.toJSON().class): TAbility | undefined {
		const key = klass === this.pbc.toJSON().class ? this.pbc.toJSON().keyability : undefined;
		return ABILITIES.find(ability => ability.slice(0, 3).toLowerCase() === key);
	}
	public getKeyAbilityScoreModifier(klass: string = this.pbc.toJSON().class): number {
		return super.getKeyAbilityScoreModifier(klass);
	}
}

class MwcAbilities extends Abilities {
	public constructor(private mwc: MythWeaversCharacter) { super(); }

	public getAbilityScore(ability: TAbility): number {
		const abilities = this.mwc.toJSON().abilities;
		const key = <TMythWeaversCharacterAbilityKey>ability.slice(0, 3).toLowerCase();
		return abilities[key];
	}
	public getKeyAbility(klass: string = this.mwc.toJSON().class): TAbility | undefined {
		const key = klass === this.mwc.toJSON().class ? this.mwc.toJSON().keyability : undefined;
		return ABILITIES.find(ability => ability.slice(0, 3).toLowerCase() === key);
	}
	public getKeyAbilityScoreModifier(klass: string = this.mwc.toJSON().class): number {
		return super.getKeyAbilityScoreModifier(klass);
	}
}