import type { TAbility } from '../common';
import { CONSTITUTION, DEXTERITY, STRENGTH } from '../common';
import { Pf2eRenderableContent } from '../Pf2eRenderableContent';
import { filterBy, findByValue } from '../data';
import type { Action } from './Action';
import type { SourcedCore } from "./base/HasSource";
import { HasSource } from './base/HasSource';
import type { RenderableContent } from '../../sage-utils/RenderUtils';

/**************************************************************************************************************************/
// Interface and Class

export interface SkillCore extends SourcedCore<"Skill"> {
	ability: TAbility;
	hasSpecialty: boolean;
	parent: string;
	trainedDetails: string[]
}

const ARMOR_PENALTY_ABILITIES = [STRENGTH, DEXTERITY, CONSTITUTION];

export class Skill extends HasSource<SkillCore> {

	public constructor(core: SkillCore) {
		super(core);
		this.hasArmorPenalty = ARMOR_PENALTY_ABILITIES.includes(this.core.ability);
	}

	/**************************************************************************************************************************/
	// Properties

	public get ability(): TAbility { return this.core.ability; }

	private _actions?: Action[];
	public get actions(): Action[] { return this._actions ?? (this._actions = filterBy("Action", action => action.skill === this.name)); }

	private _actionsTrained?: Action[];
	public get actionsTrained(): Action[] { return this._actionsTrained ?? (this._actionsTrained = this.actions.filter(action => action.trained)); }

	private _actionsUntrained?: Action[];
	public get actionsUntrained(): Action[] { return this._actionsUntrained ?? (this._actionsUntrained = this.actions.filter(action => !action.trained)); }

	public hasArmorPenalty: boolean;

	public get hasSpecialty(): boolean { return this.core.hasSpecialty; }
	public get isSpecialty(): boolean { return this.core.parent !== undefined; }

	private _parent?: Skill | null;
	public get parent(): Skill | undefined {
		if (this._parent === undefined) {
			if (this.isSpecialty) {
				this._parent = findByValue("Skill", this.core.parent) ?? null;
			}else {
				this._parent = null;
			}
		}
		return this._parent ?? undefined;
	}

	private _specialties?: Skill[];
	public get specialties(): Skill[] {
		if (!this._specialties) {
			this._specialties = filterBy("Skill", skill => skill.parent?.name === this.name);
		}
		return this._specialties;
	}

	public get trainedDetails(): string[] { return this.core.trainedDetails || []; }

	/**************************************************************************************************************************/
	// IRenderable

	public toRenderableContent(): RenderableContent {
		const content = new Pf2eRenderableContent(this);
		content.setTitle(`<b>${this.name}</b> (${this.ability.slice(0, 3)})`);
		content.append(...this.details.map((s, i) => (i ? "\t" : "") + s));

		const untrainedActions = this.actionsUntrained;
		if (untrainedActions.length) {
			const listItems = untrainedActions.map(action => `<li><b>${action.name}</b></li>`).join("");
			content.append(`<ul>${listItems}</ul>`);
		}

		const trainedDetails = this.trainedDetails;
		if (trainedDetails.length) {
			content.append(...trainedDetails.map((detail, i) => i ? detail : `<h1>${this.name} Trained Actions</h1>${detail}`));
		}

		const trainedActions = this.actionsTrained;
		if (trainedActions.length) {
			const listItems = trainedActions.map(action => `<li><b>${action.name}</b></li>`).join("");
			content.append(`<ul>${listItems}</ul>`);
		}

		if (this.hasSpecialty) {
			content.appendSection("<b>Related Skills</b> " + this.specialties.map(skill => skill.name).join(", "));
		}

		if (this.isSpecialty) {
			content.appendTitledSection(`<b>Parent</b> ${this.parent!.name}`, this.parent!.toAonLink());
		}

		return content;
	}

	// public static partition(skills: Skill[]): { category?:string; objects:Skill[]; }[] {
	// 	let map: { category?:string; objects:Skill[]; }[] = [];
	// 	map.push({ category:null, objects:Repository.filter<Skill>("Skill", skill => !skill.parent) });
	// 	map.push({ category:"Lore Skills", objects:Repository.filter<Skill>("Skill", skill => skill.isSpecialty && skill.parent.name === "Lore") });
	// 	return map;
	// }
}
