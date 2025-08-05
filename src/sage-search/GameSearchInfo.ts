import { SearchInfo, type TSearchFlag } from "@rsc-utils/core-utils";
import type { GameSystemType } from "@rsc-utils/game-utils";

export class GameSearchInfo extends SearchInfo {
	public constructor(public gameType: GameSystemType, searchText: string, flags: TSearchFlag = "") {
		super(searchText, flags);
	}
}