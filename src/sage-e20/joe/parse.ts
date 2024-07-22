import type { PdfJsonManager } from "@rsc-utils/io-utils";
import { PdfJsonParserE20 } from "../common/parse.js";
import type { PlayerCharacterCoreJoe, TArmorJoe, TWeaponJoe } from "./PlayerCharacterJoe.js";

export class PdfJsonParserJoe extends PdfJsonParserE20 {

	public parseArmor<T extends TArmorJoe>(): T[] {
		return super.parseArmor((armor, index) => {
			armor.upgrades = this.findValue(`A_Upgrade_${index}`);
			return armor;
		});
	}

	public parseCharacter(): PlayerCharacterCoreJoe {
		return {
			...super._parseCharacter(),
			gameType: "E20 - G.I. Joe",
			focus: this.findValue("Focus"),
			gear: this.findValue("Gear"),
			training: this.findValue("TRAINING_QUALIFICATIONS")
		};
	}

	public parseWeapons<T extends TWeaponJoe>(): T[] {
		return super.parseWeapons(5, (weapon, index) => {
			weapon.upgrades = this.findValue(`W_Up_${index}`);
			return weapon;
		});
	}

	/** checks the json/fields to see if this is a GI Joe character */
	public static isJoePdf(pdfJsonManager: PdfJsonManager): boolean {
		if (pdfJsonManager.title?.includes("_GI_")) {
			return true;
		}
		if (pdfJsonManager.hasAllSnippets("RENEGADE%20", "GAME%20", "STUDIOS.%20", "G.I.%20", "JOE%20")) {
			/*
			© 2021 RENEGADE GAME STUDIOS. G.I. JOE AND ALL RELATED CHARACTERS ARETRADEMARKS OF HASBRO AND ARE USED WITH PERMISSION. ©2021 HASBRO. ALL RIGHTS RESERVED. LICENSED BY HASBRO.
			*/
			return true;
		}
		return false;
	}

	public static parseCharacter(pdfJsonManager: PdfJsonManager): PlayerCharacterCoreJoe {
		return new PdfJsonParserJoe(pdfJsonManager).parseCharacter();
	}

}