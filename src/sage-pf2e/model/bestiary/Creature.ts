import type { IAbilityModifiers, IAttack, ISourceReference } from "../../common";
import { HasSource } from "../base/HasSource";
import type { CreatureCategory } from "./CreatureCategory";
import { CreatureLanguages } from "./CreatureLanguages";
import type { ICreature, ICreatureAcTac, ICreatureHp, ICreaturePerception, ICreatureSavingThrows, ICreatureSkills, ICreatureSpeed, ICreatureSpells, IOtherBlock } from "./ICreature";


export class Creature extends HasSource<ICreature> {
	public category?: CreatureCategory;
	public get fullName(): string { return this.core.fullName ?? this.name; }
	public get reference(): ISourceReference { return this.core.reference; }

	public get level(): number { return this.core.level; }

	public get perception(): ICreaturePerception { return this.core.perception; }
	public get languages(): CreatureLanguages { return new CreatureLanguages(this.core.languages); }
	public get skills(): ICreatureSkills { return this.core.skills; }
	public get abilityModifiers(): IAbilityModifiers { return this.core.abilityModifiers; }
	public get items(): string[] { return this.core.items ?? []; }
	public get interactive(): IOtherBlock[] { return this.core.interactive ?? []; }

	public get acTac(): ICreatureAcTac { return this.core.acTac; }
	public get savingThrows(): ICreatureSavingThrows { return this.core.savingThrows; }
	public get hp(): ICreatureHp { return this.core.hp; }
	public get immunities(): string[] { return this.core.immunities ?? []; }
	public get resistances(): string[] { return this.core.resistances ?? []; }
	public get weaknesses(): string[] { return this.core.weaknesses ?? []; }
	public get defensive(): IOtherBlock[] { return this.core.defensive ?? []; }

	public get speed(): ICreatureSpeed[] { return this.core.speed ?? []; }
	public get attacks(): IAttack[] { return this.core.attacks ?? []; }
	public get spells(): ICreatureSpells[] { return this.core.spells ?? []; }
	public get offensive(): IOtherBlock[] { return this.core.offensive ?? []; }

	public toListItemHtml(): string {
		return `<a href="#${this.id}" class="list-group-item list-group-item-halfmug" data-action="show-right" data-type="creature" data-id="${this.id}">${this.name}</a>`;
	}

}
