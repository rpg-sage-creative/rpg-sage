import { Pf2eRenderableContent } from '../Pf2eRenderableContent';
import { findByValue } from '../data';
import type { SourcedCore } from "./base/HasSource";
import { HasSource } from './base/HasSource';
import type { FocusSpell } from './FocusSpell';
import type { RenderableContent } from '../../sage-utils/RenderUtils';

export interface DomainCore extends SourcedCore<"Domain"> {
	spells: string[];
}

export class Domain extends HasSource<DomainCore> {
	private _spells?: FocusSpell[];

	public get spells(): FocusSpell[] {
		return this._spells ?? (this._spells = this.core.spells.map(spell =>
			findByValue("FocusSpell", spell)!
		));
	}

	/**************************************************************************************************************************/
	// IRenderable

	public toRenderableContent(): RenderableContent {
		const content = new Pf2eRenderableContent(this);
		content.setTitle(`<b>${this.name}</b> (Domain)`);
		content.append(this.description);
		content.append(`<b>Domain Spell</b> <i>${this.spells[0] && this.spells[0].nameLower || this.core.spells[0].toLowerCase()}</i>`);
		content.append(`<b>Advanced Domain Spell</b> <i>${this.spells[1] && this.spells[1].nameLower || this.core.spells[1].toLowerCase()}</i>`);

		content.addAonLink(...this.spells.filter((spell, index) => {
			if (!spell) {
				console.warn(`Missing Domain (${this.name}) Spell: ${this.core.spells[index]}`);
			}
			return !!spell;
		}).map(spell => spell.toAonLink()));

		return content;
	}
	public toAonLink(): string {
		return super.toAonLink(`${this.name} Domain`);
	}
}
