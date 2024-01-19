import { randomSnowflake } from "@rsc-utils/snowflake-utils";
import { CharacterShell } from "../../../model/CharacterShell";
import type { Game } from "../../../model/Game";
import { Manager } from "../common/Manager";
import { Encounter, type EncounterCore } from "./Encounter";

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
