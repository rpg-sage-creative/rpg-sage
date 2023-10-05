import * as Repository from '../data/Repository';
import Spell from './Spell';
import type { SpellCoreBase } from './Spell';
import type Domain from './Domain';

export type FocusSpellCore = SpellCoreBase<"FocusSpell">;
/*// export interface FocusSpellCore extends SpellCoreBase<"FocusSpell"> { }*/

export default class FocusSpell extends Spell<"FocusSpell", FocusSpellCore> {

	public constructor(core: FocusSpellCore) {
		super(core);
		this.isFocus = true;
	}

	public get searchResultCategory(): string {
		const level = this.isCantrip ? `Cantrip` : `Focus ${this.level}`;
		let specialName = this.archetypeName ?? this.domainName;
		if (!specialName) {
			// In case I forget to set the domain
			specialName = Repository.find("Domain", (domain: Domain) => domain.toJSON().spells.includes(this.name))?.name;
		}
		if (!specialName) {
			// Check the traits for a class
			const classNames = Repository.all("Class").map(clss => clss.name);
			specialName = this.traits.find(trait => classNames.includes(trait));
		}
		// if (!specialName) debug(this.archetypeName, this.domainName, this.traits);
		const specialLabel = specialName ? ` (${specialName})` : ``;
		return level + specialLabel;
	}

	public static find<T extends Spell>(value: string): T | undefined {
		return Repository.findByValue("FocusSpell", value) as T | undefined;
	}

	//#region static

	/** Reprents the objectType in Archives of Nethys */
	public static get aon(): string {
		return "Spells";
	}

	//#endregion
}
