import type { GameType } from "../sage-common";
import { SearchInfo } from "../sage-utils/utils/SearchUtils";
import type { TSearchFlag } from "../sage-utils/utils/SearchUtils/SearchInfo";

export class GameSearchInfo extends SearchInfo {
	public constructor(public gameType: GameType, searchText: string, flags: TSearchFlag = "") {
		super(searchText, flags);
	}
}