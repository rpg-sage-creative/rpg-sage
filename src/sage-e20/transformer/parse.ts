import { PdfJsonParserE20 } from "../common/parse";
import type { TField, TRawJson } from "../common/pdf";
import type { TWeaponE20 } from "../common/PlayerCharacterE20";
import type { PlayerCharacterCoreTransformer, TAltMode, TWeaponTransformer } from "./PlayerCharacterTransformer";

export class PdfJsonParserTransformer extends PdfJsonParserE20 {

	public parseCharacter(): PlayerCharacterCoreTransformer {
		const gear = this.findValue("PERKS");
		return {
			...super._parseCharacter(),
			gameType: "E20 - Transformers",
			altModes: this.parseAltModes(),
			autobot: this.findChecked("fct1"),
			decepticon: this.findChecked("fct2"),
			energon: this.findValue("Personal_Power"),
			gear,
			perks: this.findValue("POWERS")
		};
	}

	public parseWeapons<T extends TWeaponE20>(): T[] {
		const hardpoints: TWeaponTransformer[] = [];
		for (let i = 1; i <= 6; i++) {
			hardpoints.push({
				name: this.findValue(`Name${i}`),
				range: this.findValue(`Range${i}`) ?? this.findValue(`Range_${i}`),
				hardpoint: this.findValue(`W_Hands${i}`) ?? this.findValue(`W_Hands_${i}`),
				traits: this.findValue(`W_Traits${i}`) ?? this.findValue(`W_Traits_${i}`),
				attack: this.findValue(`W_Att${i}`) ?? this.findValue(`W_Att_${i}`) ?? this.findValue(`W_At${i}`),
				effects: this.findValue(`W_Eff${i}`) ?? this.findValue(`W_Eff_${i}`),
				altEffects: this.findValue(`W_Alt${i}`) ?? this.findValue(`W_Alt_${i}`)
			});
		}
		return hardpoints as T[];
	}

	public parseAltModes(): TAltMode[] {
		const altModes: TAltMode[] = [];
		for (let i = 1; i <= 2; i++) {
			const oneOrTwo = i === 2 ? "2" : "";
			const moveOneOrTwo = [["","2"],["3","4"]][i - 1];
			altModes.push({
				name: this.findValue(`ORG_Name${oneOrTwo}`),
				crew: this.findValue(`Crew${oneOrTwo}`),
				health: this.findValue(`Health${oneOrTwo}`),
				size: this.findValue(`Size${oneOrTwo}`),
				features: this.findValue(`Features${oneOrTwo}`),
				movement: [
					this.findValue(`MOV${moveOneOrTwo[0]}`),
					this.findValue(`MOV${moveOneOrTwo[1]}`)
				].filter(s => s) as string[],
				attacks: [
					{
						name: this.findValue(`Weapon${moveOneOrTwo[0]}`),
						range: this.findValue(`Range${moveOneOrTwo[0]}`),
						effects: this.findValue(`Effects${moveOneOrTwo[0]}`)
					},
					{
						name: this.findValue(`Weapon${moveOneOrTwo[1]}`),
						range: this.findValue(`Range${moveOneOrTwo[1]}`),
						effects: this.findValue(`Effects${moveOneOrTwo[1]}`)
					}
				].filter(atk => atk.name || atk.range || atk.effects),
				toughness: this.findValue(`Tough${oneOrTwo}`),
				evasion: this.findValue(`Eva${oneOrTwo}`),
				willpower: this.findValue(`Will${oneOrTwo}`),
				cleverness: this.findValue(`Clever${oneOrTwo}`),
			});
		}
		return altModes;
	}


	/** checks the json/fields to see if this is a Power Rangers character */
	public static isTransformerPdf(_rawJson: TRawJson, fields: TField[]): boolean {
		return fields.find(field => field.name === "Crew2") !== undefined
			&& fields.find(field => field.name === "MOV4") !== undefined;
	}

	public static parseCharacter(fields: TField[]): PlayerCharacterCoreTransformer {
		return new PdfJsonParserTransformer(fields).parseCharacter();
	}
}