import { SearchInfo, type TSearchFlag } from "@rsc-utils/search-utils";
import type { GameType } from "../sage-common";

export class GameSearchInfo extends SearchInfo {
	public constructor(public gameType: GameType, searchText: string, flags: TSearchFlag = "") {
		super(searchText, flags);
	}
}