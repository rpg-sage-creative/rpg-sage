import { isBlank } from "../../sage-utils/utils/StringUtils";
import { generate } from "../../sage-utils/utils/UuidUtils";
import { PdfJsonFields, TRawJson } from "./pdf";
import type { PlayerCharacterCoreE20, TArmorE20, TAttackE20, TSkillE20, TStatE20, TWeaponE20 } from "./PlayerCharacterE20";

/** All the skills (name and abbreviation) for each ability. */
const SkillPairs = {
	Strength: [
		["Athletics", "Ath"],
		["Brawn", "Bra"],
		["Conditioning", "Cond"],
		["Intimidation", "Int"],
		["Might", "Mig"]
	],
	Speed: [
		["Acrobatics", "Acr"],
		["Driving", "Dri"],
		["Finesse", "Fin"],
		["Infiltration", "Inf"],
		["Initiative", "Ini"],
		["Targeting", "Tar"]
	],
	Smarts: [
		["Alertness", "Ale"],
		["Culture", "Cul"],
		["Science", "Sci"],
		["Survival", "Sur"],
		["Technology", "Tec"]
	],
	Social: [
		["Animal Handling", "Ani"],
		["Deception", "Dec"],
		["Performance", "Per"],
		["Persuasion", "Prs"],
		["Streetwise", "Str"]
	]
};

export type SkillPairKey = keyof typeof SkillPairs;

/** returns only the values that have a least one key that is non-blank */
export function filterValuesWithKeys<T>(values: T[]): T[] {
	return values.filter((value: any) =>
		Object.keys(value).find(key => !isBlank(value[key])) !== undefined
	);
}

export class PdfJsonParserE20 extends PdfJsonFields {

	public parseArmor<T extends TArmorE20>(ext: (armor: T, index: number) => T = _armor => _armor): T[] {
		const armor: T[] = [];
		for (let i = 1; i <= 3; i++) {
			armor.push(ext({
				name: this.findValue(`A_T_${i}`),
				description: this.findValue(`A_Desc_${i}`),
				effect: this.findValue(`A_Eff_${i}`),
				traits: this.findValue(`A_Traits_${i}`)
			} as T, i));
		}
		return filterValuesWithKeys(armor);
	}

	/** removes and returns all the fields for an attack at the given index */
	private parseAttack(index: number): TAttackE20 {
		return {
			attack: this.findValue(`Att_${index}`),
			name: this.findValue(`Att_Name_${index}`),
			range: this.findValue(`Att_Rng_${index}`),
			effects: this.findValue(`Att_Eff_${index}`),
			notes: this.findValue(`Att_Note_${index}`)
		};
	}

	public parseAttacks(): TAttackE20[] {
		const attacks = [];
		for (let i = 1; i <= 5; i++) {
			attacks.push(this.parseAttack(i));
		}
		return filterValuesWithKeys(attacks);
	}

	protected _parseCharacter<T extends PlayerCharacterCoreE20>(): T {
		return {
			objectType: "PlayerCharacter",
			diceEngine: "E20",
			gameType: undefined!,
			id: generate(),

			abilities: [
				this.parseStat("Strength", "Toughness", "Str"),
				this.parseStat("Speed", "Evasion", "Spd"),
				this.parseStat("Smarts", "Willpower", "Sma"),
				this.parseStat("Social", "Cleverness", "Soc")
			],
			armor: this.parseArmor(),
			attacks: this.parseAttacks(),
			backgroundBonds: this.findValue("BACKGROUND_BONDS"),
			damage: this.parseDamage(),
			description: this.findValue("Description"),
			focus: this.findValue("Focus"),
			gear: this.findValue("Gear"),
			hangUps: this.findValue("Hang_Ups"),
			health: this.findValue("Health"),
			influences: this.findValue("Influences"),
			languages: this.findValue("Languages"),
			level: this.findValue("Level"),
			movement: this.findValue("Movement"),
			name: this.findValue("Character_Name"),
			notes: this.findValue("Notes"),
			origin: this.findValue("Origin"),
			perks: this.findValue("PERKS"),
			pronouns: this.findValue("Pronouns"),
			role: this.findValue("Role"),
			trainingAndQualifications: this.findValue("TRAINING_QUALIFICATIONS"),
			weapons: this.parseWeapons()
		} as PlayerCharacterCoreE20 as T;
	}

	public parseDamage(prefix = ""): number {
		let count = 0;
		for (let i = 1; i <= 20; i++) {
			let key = `${prefix}d${i}`;
			if (!this.find(key)) {
				/** @todo remove this if block when the PDF gets updated to correct these field ids */
				key = key.replace("d15", "4d").replace("d16", "5d16").replace("d18", "18");
			}
			const checked = this.findChecked(key);
			if (checked) {
				count++;
			}
		}
		return count;
	}

	protected parseSkill(name: string, prefix: string): TSkillE20 {
		const skill: TSkillE20 = { name };
		const prefixLower = prefix.toLowerCase();
		const dice = ["", "d2", "d4", "d6", "d8", "d10", "d12"];
		for (let i = 1; i <= 6; i++) {
			if (name === "Conditioning") {
				const bonusChecked = this.findChecked(`${prefix}${i}`);
				if (bonusChecked) {
					skill.bonus = i;
				}
			}else {
				const dieChecked = this.findChecked(`${prefixLower}${i}`);
				if (dieChecked) {
					skill.die = dice[i];
				}
			}

			if (i <= 3 && !["Conditioning","Initiative"].includes(name)) {
				const specName = this.findValue(`${prefix}_Sp_${i}`);
				const specChecked = this.findChecked(`${prefixLower}_spec_${i}`);
				if (specName) {
					if (!skill.specializations) {
						skill.specializations = [];
					}
					skill.specializations.push({ name:specName, checked:specChecked });
				}
			}
		}
		return skill;
	}

	public parseSkills(ability: SkillPairKey): TSkillE20[] {
		return SkillPairs[ability].map(([name, prefix]) => this.parseSkill(name, prefix));
	}

	public parseStat(ability: SkillPairKey, defense: string, prefix: string): TStatE20 {
		return {
			ability: this.findValue(ability),
			abilityName: ability,
			armor: prefix === "Str" ? this.findValue(`${prefix}_Arm`) : undefined,
			bonus: prefix !== "Str" ? this.findValue(`${prefix}_Bon`) : undefined,
			defense: this.findValue(defense),
			defenseName: defense,
			essence: this.findValue(`${prefix}_Ess`),
			perks: this.findValue(`${prefix}_Perk`),
			skills: this.parseSkills(ability)
		};
	}

	/** removes and returns all the fields for a weapon at the given index */
	public parseWeapons<T extends TWeaponE20>(count = 3, ext: (weapon: T, index: number) => T = _weapon => _weapon): T[] {
		const weapons: T[] = [];
		for (let i = 1; i <= count; i++) {
			// check before we try and remove these fields
			const hasTraits = this.find(`W_Traits_${i}`);
			const hasHands = this.find(`W_Hands_${i}`);

			// create weapon
			const weapon = ext({
				name: this.findValue(`Wea${i}`),
				range: this.findValue(`W_Rng_${i}`),
				hands: this.findValue(`W_Hands_${i}`),
				traits: this.findValue(`W_Traits_${i}`),
				attack: this.findValue(`W_Att_${i}`),
				effects: this.findValue(`W_Eff_${i}`),
				altEffects: this.findValue(`W_Alt_${i}`)
			} as T, i);

			// check for these incorrectly named fields
			if (!hasTraits && i === 2 && this.find("W_Traits_7")) {
				weapon.traits = this.findValue("W_Traits_7");
			}
			if (!hasHands && i === 3 && this.find("W_Rng_7")) {
				weapon.hands = this.findValue("W_Rng_7");
			}

			weapons.push(weapon);

		}
		return filterValuesWithKeys(weapons);
	}

	/** used to check the pdfs pages/texts for specific pieces of text */
	public static isRenegadePdf(rawJson: TRawJson, ...textsToFind: string[]): boolean {
		// track which were found
		const textsFound = textsToFind.map(_ => false);
		// iterate pages
		const pages = rawJson.Pages ?? [];
		for (const page of pages) {
			// iterate texts
			const texts = page.Texts ?? [];
			for (const text of texts) {
				// grab string sections
				const strings = text.R?.map(r => r.T) ?? [];
				// mark found texts as found
				textsToFind.forEach((t, i) => {
					if (strings.includes(t)) {
						textsFound[i] = true;
					}
				});
				// return true as soon as each text is found
				if (!textsFound.includes(false)) {
					return true;
				}
			}
		}
		return false;
	}
}
