import utils from "../../sage-utils";
import { findByValue } from "../data/Repository";
import type ArcaneSchool from "./ArcaneSchool";
import type { SourcedCore } from "./base/HasSource";
import HasSource from "./base/HasSource";

export interface SingleCasterSpellCore extends SourcedCore<"SingleCasterSpell"> {
	caster: string;
	level: number;
	school: string;
}

const promises: { [caster: string]: Promise<void>; } = {};
const spells: { [caster: string]: SingleCasterSpell[] } = {};
export default class SingleCasterSpell extends HasSource<SingleCasterSpellCore> {

	public get caster(): string { return this.core.caster; }
	public get level(): number { return this.core.level; }
	public get school(): ArcaneSchool { return findByValue("ArcaneSchool", this.core.school)!; }

	// public toSlimSpell(): SlimSpell {
	// 	let slim: ISlimSpell = {
	// 		casters: [ { caster:this.core.caster, level:this.core.level } ],
	// 		name: this.core.name,
	// 		school: this.core.school,
	// 		source: this.core.source
	// 	};
	// 	return new SlimSpell(slim);
	// }

	public static find(caster: string, value: string): SingleCasterSpell {
		const stringMatcher = utils.StringUtils.StringMatcher.from(value);
		return spells[caster].find(spell => spell.matches(stringMatcher))!;
	}

	public static byCaster(caster: string): SingleCasterSpell[] {
		return spells[caster] || [];
	}

	public static loadCaster(caster: string): Promise<void> {
		if (!promises[caster]) {
			promises[caster] = new Promise<void>(async resolve => {
				/*
				// await ArcaneSchool.load();
				// let json = await ajax<ISingleCasterSpell>(`./data/json/ed1/spells-slim/spells-slim-${caster}.json`);
				// spells[caster] = json.map(s => {
				// 	s.caster = caster;
				// 	return new SingleCasterSpell(s);
				// });
				*/
				resolve();
			});
		}
		return promises[caster];
	}

}
