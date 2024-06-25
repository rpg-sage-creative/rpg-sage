import { randomSnowflake } from "@rsc-utils/core-utils";
import { CharacterShell } from "../../../model/CharacterShell.js";
import type { Game } from "../../../model/Game.js";
import { Manager } from "../common/Manager.js";
import { Encounter, type EncounterCore } from "./Encounter.js";

export class EncounterManager extends Manager<EncounterCore, Encounter> {

	protected changed(): void {
		/* reset any calculated variables */
	}

	protected createCore(name: string): EncounterCore {
		return { characters:[], id:randomSnowflake(), name };
	}

	public findActiveChar(name: string): CharacterShell | undefined {
		const encounters = this.all;
		const active = encounters.filter(enc => enc.active);
		for (const enc of active) {
			const char = enc.getCharShell(name);
			if (char) {
				return char;
			}
		}
		return undefined;
	}

	protected wrap(core: EncounterCore): Encounter {
		return new Encounter(core, this.game);
	}

	public static from(cores: EncounterCore[], game: Game): EncounterManager {
		return new EncounterManager(cores, game);
	}
}
