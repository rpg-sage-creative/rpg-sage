import { find } from "../data/Repository";
import type Archetype from "./Archetype";
import Feat from "./Feat";

export default class DedicationFeat extends Feat<"DedicationFeat"> {

	private _archetype?: Archetype;
	public get archetype(): Archetype {
		if (this._archetype === undefined) {
			const archetypeName = `${this.name}`.replace(/\s+Dedication$/i, "");
			this._archetype = find("Archetype", archetype => archetype.name === archetypeName)!;
		}
		return this._archetype;
	}

	public isDedication = true;
	public isMulticlass = this.traits.includes("Multiclass");

}
