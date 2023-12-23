import type { Optional } from "../../../../../sage-utils";
import type { CharacterShellCore } from "../../../model/CharacterShell";
import type Game from "../../../model/Game";
import { Manager } from "../common/Manager";
import { Party, type PartyCore } from "./Party";

export class PartyManager extends Manager<PartyCore, Party> {

	protected changed(): void {
		/* reset any calculated variables */
	}

	protected createCore(name: string): PartyCore {
		return { characters:[], id:String(Date.now()), name };
	}

	protected wrap(core: PartyCore): Party {
		return new Party(core, this.game);
	}

	public getDefault(): Party {
		const characters = this.game.playerCharacters.map(pc => {
			return {
				gameCharacterId: pc.id,
				id: String(Date.now()),
				label: pc.name,
				nickname: pc.name,
				type: "pc"
			} as CharacterShellCore;
		});
		const core = {
			characters,
			id: String(Date.now()),
			name: "Player Characters",
			// type: "pc"
		};
		return new Party(core, this.game);
	}

	public getOrDefault(name: Optional<string>): Party {
		return this.get(name)
			?? this.first
			?? this.getDefault();
	}

	public static from(cores: PartyCore[], game: Game): PartyManager {
		return new PartyManager(cores, game);
	}
}