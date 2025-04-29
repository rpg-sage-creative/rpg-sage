import { HasCore, type Core, type UUID } from "@rsc-utils/core-utils";
import { DASH } from "../common.js";
import { Spell } from "./Spell.js";

export interface HeightenedSpellCore extends Core<"HeightenedSpell"> {
	bumps: number;
	change?: string;
	level: number;
	spell: UUID;
}

export class HeightenedSpell extends HasCore<HeightenedSpellCore> {
	public id: string;

	public constructor(core: HeightenedSpellCore) {
		super(core);
		this.id = core.objectType.toLowerCase() + DASH + core.spell + DASH + core.level;
	}

	public get bumps(): number { return this.core.bumps; }
	public get change(): string | undefined { return this.core.change; }
	public get level(): number { return this.core.level; }
	public get spell(): Spell { return Spell.find(this.core.spell)!; }

	public toNextLevel(change?: string, bump?: boolean): HeightenedSpell {
		return new HeightenedSpell({
			bumps: this.core.bumps + (bump && 1 || 0),
			change: change || this.core.change,
			level: this.core.level + 1,
			objectType: this.core.objectType,
			spell: this.core.spell
		});
	}

	public static find(value: UUID): HeightenedSpell | undefined {
		const parts = value.split(DASH),
			spellId = parts.slice(1, -1).join(DASH),
			spell = Spell.find(spellId),
			level = +parts.pop()!;
		return spell?.toHeightenedSpell(level);
	}

}
