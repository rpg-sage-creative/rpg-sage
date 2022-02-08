import * as Repository from '../data/Repository';
import Spell from './Spell';
import type { SpellCoreBase } from './Spell';

export type FocusSpellCore = SpellCoreBase<"FocusSpell">;
/*// export interface FocusSpellCore extends SpellCoreBase<"FocusSpell"> { }*/

export default class FocusSpell extends Spell<"FocusSpell", FocusSpellCore> {

	public constructor(core: FocusSpellCore) {
		super(core);
		this.isFocus = true;
	}

	public get searchResultCategory(): string {
		const level = this.isCantrip ? `Cantrip` : `Focus ${this.level}`;
		const classNames = Repository.all("Class").map(clss => clss.name);
		return `${level} (${this.archetypeName ?? this.traits.find(trait => classNames.includes(trait))})`;
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
