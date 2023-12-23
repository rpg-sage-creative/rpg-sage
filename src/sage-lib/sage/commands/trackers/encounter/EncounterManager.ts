import type Game from "../../../model/Game";
import { Encounter, type EncounterCore } from "./Encounter";
import { Manager } from "../common/Manager";

export class EncounterManager extends Manager<EncounterCore, Encounter> {

	protected changed(): void {
		/* reset any calculated variables */
	}

	protected createCore(name: string): EncounterCore {
		return { characters:[], id:String(Date.now()), name };
	}

	protected wrap(core: EncounterCore): Encounter {
		return new Encounter(core, this.game);
	}

	public static from(cores: EncounterCore[], game: Game): EncounterManager {
		return new EncounterManager(cores, game);
	}
}
