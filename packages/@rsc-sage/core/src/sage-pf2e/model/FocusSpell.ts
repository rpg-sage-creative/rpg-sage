import { all, find, findByValue } from "../data/Repository.js";
import type { Domain } from "./Domain.js";
import { Spell, type SpellCoreBase } from "./Spell.js";

export type FocusSpellCore = SpellCoreBase<"FocusSpell">;
/*// export interface FocusSpellCore extends SpellCoreBase<"FocusSpell"> { }*/

export class FocusSpell extends Spell<"FocusSpell", FocusSpellCore> {

	public constructor(core: FocusSpellCore) {
		super(core);
		this.isFocus = true;
	}

	public get searchResultCategory(): string {
		const level = this.isCantrip ? `Cantrip` : `Focus ${this.level}`;
		let specialName = this.archetypeName ?? this.domainName;
		if (!specialName) {
			// In case I forget to set the domain
			specialName = find("Domain", (domain: Domain) => domain.toJSON().spells.includes(this.name))?.name;
		}
		if (!specialName) {
			// Check the traits for a class
			const classNames = all("Class").map(clss => clss.name);
			specialName = this.traits.find(trait => classNames.includes(trait));
		}
		// if (!specialName) debug(this.archetypeName, this.domainName, this.traits);
		const specialLabel = specialName ? ` (${specialName})` : ``;
		return level + specialLabel;
	}

	public static find<T extends Spell>(value: string): T | undefined {
		return findByValue("FocusSpell", value) as T | undefined;
	}

	//#region static

	/** Reprents the objectType in Archives of Nethys */
	public static get aon(): string {
		return "Spells";
	}

	//#endregion
}
