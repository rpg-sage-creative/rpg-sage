import { randomSnowflake, type Optional } from "@rsc-utils/core-utils";
import type { CharacterShellCore } from "../../../model/CharacterShell.js";
import type { Game } from "../../../model/Game.js";
import { Manager } from "../common/Manager.js";
import { Party, type PartyCore } from "./Party.js";

export class PartyManager extends Manager<PartyCore, Party> {

	protected changed(): void {
		/* reset any calculated variables */
	}

	protected createCore(name: string): PartyCore {
		return { characters:[], id:randomSnowflake(), name };
	}

	protected wrap(core: PartyCore): Party {
		return new Party(core, this.game);
	}

	public getDefault(): Party {
		const characters = this.game.playerCharacters.map(pc => {
			return {
				gameCharacterId: pc.id,
				id: randomSnowflake(),
				label: pc.name,
				nickname: pc.name,
				type: "pc"
			} as CharacterShellCore;
		});
		const core = {
			characters,
			id: randomSnowflake(),
			name: "Player Characters",
			// type: "pc"
		};
		return new Party(core, this.game);
	}

	public getOrDefault(name: Optional<string>): Party {
		return this.get(name)
			?? this.only
			?? this.getDefault();
	}

	public static from(cores: PartyCore[], game: Game): PartyManager {
		return new PartyManager(cores, game);
	}
}