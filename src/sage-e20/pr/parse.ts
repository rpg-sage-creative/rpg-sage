import type { TSkillDie } from "../../sage-dice/dice/essence20";
import { filterValuesWithKeys, PdfJsonParserE20, SkillPairKey } from "../common/parse";
import type { TField, TRawJson } from "../common/pdf";
import type { PlayerCharacterCorePR, TAttackZord, TSkillZord, TStatPR, TStatZord, TZord } from "./PlayerCharacterPR";

const ZordSkills = {
	Strength: [
		["Brawn", "zini"],
		["Conditioning", "zc"],
		["Might", "zi"],
	],
	Speed: [
		["Driving", "zd"],
		["Initiative", "zin"]
	],
	Other: [
		["Zord_Blank_Skill", "zb"]
	]
};

export class PdfJsonParserPR extends PdfJsonParserE20 {

	public parseCharacter(): PlayerCharacterCorePR {
		return {
			...super._parseCharacter(),
			gameType: "E20 - Power Rangers",
			inventory: this.findValue("Inventory"),
			personalPower: this.findValue("Personal_Power"),
			powers: this.findValue("POWERS"),
			zord: this.parseZord()
		};
	}

	public parseStat(ability: SkillPairKey, defense: string, prefix: string): TStatPR {
		return {
			...super.parseStat(ability, defense, prefix),
			morphed: this.findValue(`${prefix}_Morph`)
		};
	}

	public parseZord(): TZord {
		return {
			abilities: [
				this.parseZordStat("Strength", "Str", "Toughness", "T"),
				this.parseZordStat("Speed", "Spd", "Evasion", "Eva"),
				this.parseZordStat("Other")
			],
			attacks: this.parseZordAttacks(),
			damage: this.parseDamage("z_"),
			features: this.findValue("FEATURES"),
			health: this.findValue("Zord_Health"),
			movement: this.findValue("Zord_Move"),
			name: this.findValue("Zord_Name"),
			size: this.findValue("Size"),
			skillNotes: this.findValue("SKILL_NOTES")
		};
	}

	private parseZordAttacks(): TAttackZord[] {
		const attacks: TAttackZord[] = [];
		for (let i = 1; i <= 2; i++) {
			attacks.push({
				name: this.findValue(`ZW${i}`),
				range: this.findValue(`ZW_Rng_${i}`),
				effects: this.findValue(`ZW_Eff_${i}`)
			});
		}
		return filterValuesWithKeys(attacks);
	}

	private parseZordSkill(name: string, prefix: string): TSkillZord {
		const skill: TSkillZord = {
			name: name === "Zord_Blank_Skill" ? this.findValue("Zord_Blank_Skill") : name
		};
		const dice = ["", "d2", "d4", "d6", "d8", "d10", "d12"];
		for (let i = 1; i <= 6; i++) {
			if (name === "Conditioning") {
				const bonusChecked = this.findChecked(`${prefix}${i}`);
				if (bonusChecked) {
					skill.bonus = i;
				}
			}else {
				const dieChecked = this.findChecked(`${prefix}${i}`);
				if (dieChecked) {
					skill.die = dice[i] as TSkillDie;
				}
			}
		}
		return skill;
	}

	private parseZordSkills(pairs: string[][]): TSkillZord[] {
		return pairs.map(([name, prefix]) => this.parseZordSkill(name, prefix));
	}

	private parseZordStat(ability: keyof typeof ZordSkills, abilSuffix?: string, defense?: string, defSuffix?: string): TStatZord {
		return {
			ability: abilSuffix ? this.findValue(`Zord_${abilSuffix}`) : undefined,
			abilityName: ability,
			defense: defSuffix ? this.findValue(`Zord_${defSuffix}`) : undefined,
			defenseName: defense ? defense : undefined,
			skills: this.parseZordSkills(ZordSkills[ability])
		};
	}

	/** checks the json/fields to see if this is a Power Rangers character */
	public static isPowerRangerPdf(_rawJson: TRawJson, fields: TField[]): boolean {
		if (fields.find(field => field.name === "Zord_Name")) {
			return true;
		}
		// if (isRenegadePdf(rawJson, "")) {
		//	 return true;
		// }
		/*
		© 2021 RENEGADE GAME STUDIOS. TM & © 2021 SCG POWER RANGERS LLC AND HASBRO
		*/
		return false;
	}

	public static parseCharacter(fields: TField[]): PlayerCharacterCorePR {
		return new PdfJsonParserPR(fields).parseCharacter();
	}
}